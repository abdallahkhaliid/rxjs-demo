/**
 * Empirical Adversarial Test Harness for Milestone 1 Backend
 * Challenger 2: Backend & Edge-Case Challenger
 *
 * Spawns the Express server on an isolated port, executes boundary,
 * concurrency, statistical, and regression suites, and reports empirical data.
 */

const { spawn } = require('child_process');
const http = require('http');

const PORT = 9000;
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess = null;
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function record(name, passed, details = '') {
  if (passed) {
    results.passed++;
    console.log(`  [PASS] ${name}${details ? ' - ' + details : ''}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] ${name} - ${details}`);
  }
  results.tests.push({ name, passed, details });
}

async function fetchJson(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const start = Date.now();
  const res = await fetch(url, options);
  const elapsed = Date.now() - start;
  const status = res.status;
  const headers = Object.fromEntries(res.headers.entries());
  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status, body, elapsed, headers };
}

async function waitForServer(maxWaitMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.status === 200) return true;
    } catch {
      // not yet ready
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Server did not respond on ${BASE_URL} within ${maxWaitMs}ms`);
}

function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`Starting Express server on port ${PORT}...`);
    serverProcess = spawn('npx', ['ts-node', '-P', 'server/server.tsconfig.json', 'server/server.ts'], {
      env: { ...process.env, PORT: String(PORT) },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (d) => {
      const msg = d.toString();
      if (msg.includes('REST API running')) {
        console.log(`Server output: ${msg.trim()}`);
      }
    });

    serverProcess.stderr.on('data', (d) => {
      // Ignore ts-node notice
      const msg = d.toString();
      if (!msg.includes('ExperimentalWarning') && !msg.includes('Browserslist')) {
        console.error(`Server stderr: ${msg.trim()}`);
      }
    });

    serverProcess.on('error', reject);

    waitForServer()
      .then(() => {
        console.log(`Express server successfully initialized on port ${PORT}.\n`);
        resolve();
      })
      .catch(reject);
  });
}

function stopServer() {
  if (serverProcess) {
    console.log('\nShutting down Express test server...');
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
      } catch {
        serverProcess.kill();
      }
    } else {
      serverProcess.kill('SIGTERM');
    }
  }
}

async function runSlowEndpointSuite() {
  console.log('=== Suite 1: GET /api/slow — Clamping, Boundaries & Concurrency ===');

  // 1. Default delay
  {
    const res = await fetchJson('/api/slow');
    const ok = res.status === 200 && res.body.delay === 2000 && res.body.tag === 'default' && res.body.status === 'success';
    record('1.1 Default delay parameter (delay omitted defaults to 2000ms)', ok, `status=${res.status}, delay=${res.body?.delay}, tag=${res.body?.tag}`);
  }

  // 2. Negative delay clamped to 0
  {
    const res = await fetchJson('/api/slow?delay=-1000');
    const ok = res.status === 200 && res.body.delay === 0 && res.elapsed < 150;
    record('1.2 Negative delay boundary (delay=-1000 clamped to 0ms)', ok, `delay=${res.body?.delay}, elapsed=${res.elapsed}ms`);
  }

  // 3. Negative float clamped to 0
  {
    const res = await fetchJson('/api/slow?delay=-0.5');
    const ok = res.status === 200 && res.body.delay === 0 && res.elapsed < 150;
    record('1.3 Negative float delay (delay=-0.5 clamped to 0ms)', ok, `delay=${res.body?.delay}, elapsed=${res.elapsed}ms`);
  }

  // 4. Zero delay immediate return
  {
    const res = await fetchJson('/api/slow?delay=0');
    const ok = res.status === 200 && res.body.delay === 0 && res.elapsed < 150;
    record('1.4 Zero delay boundary (delay=0 returns immediately)', ok, `delay=${res.body?.delay}, elapsed=${res.elapsed}ms`);
  }

  // 5. Non-numeric NaN delay fallback
  {
    const res = await fetchJson('/api/slow?delay=abc');
    const ok = res.status === 200 && res.body.delay === 2000;
    record('1.5 Non-numeric delay (delay=abc falls back to 2000ms)', ok, `delay=${res.body?.delay}, elapsed=${res.elapsed}ms`);
  }

  // 6. Tag tracking
  {
    const customTag = 'adversarial-tag-alpha-42';
    const res = await fetchJson(`/api/slow?delay=0&tag=${encodeURIComponent(customTag)}`);
    const ok = res.status === 200 && res.body.tag === customTag;
    record('1.6 Custom tag preservation', ok, `tag received="${res.body?.tag}"`);
  }

  // 7. Intermediate delay timing accuracy
  {
    const targetDelay = 200;
    const res = await fetchJson(`/api/slow?delay=${targetDelay}`);
    const ok = res.status === 200 && res.body.delay === targetDelay && res.elapsed >= 180 && res.elapsed <= 400;
    record('1.7 Intermediate delay accuracy (delay=200ms timing window)', ok, `delay=${res.body?.delay}, actualElapsed=${res.elapsed}ms`);
  }

  // 8. Event loop non-blocking concurrency test
  {
    console.log('  Testing 5 concurrent requests with staggered delays...');
    const startTime = Date.now();
    const completionOrder = [];

    const reqConfigs = [
      { id: 'Req-A', delay: 350, tag: 'stream-A' },
      { id: 'Req-B', delay: 50,  tag: 'stream-B' },
      { id: 'Req-C', delay: 200, tag: 'stream-C' },
      { id: 'Req-D', delay: 100, tag: 'stream-D' },
      { id: 'Req-E', delay: 250, tag: 'stream-E' },
    ];

    const promises = reqConfigs.map(cfg => {
      return fetchJson(`/api/slow?delay=${cfg.delay}&tag=${cfg.tag}`)
        .then(res => {
          const finishedAt = Date.now() - startTime;
          completionOrder.push({ id: cfg.id, tag: cfg.tag, delay: cfg.delay, finishedAt, status: res.status });
          return res;
        });
    });

    const responses = await Promise.all(promises);
    const totalWallClock = Date.now() - startTime;

    const all200 = responses.every(r => r.status === 200);
    // Expected order: Req-B (~50ms) -> Req-D (~100ms) -> Req-C (~200ms) -> Req-E (~250ms) -> Req-A (~350ms)
    const expectedOrder = ['Req-B', 'Req-D', 'Req-C', 'Req-E', 'Req-A'];
    const actualOrder = completionOrder.map(c => c.id);
    const orderMatches = JSON.stringify(expectedOrder) === JSON.stringify(actualOrder);
    const nonBlocking = totalWallClock < 650; // sum would be 950ms if blocking

    record(
      '1.8 Concurrency: Non-blocking asynchronous event loop execution',
      all200 && nonBlocking && orderMatches,
      `Wall-clock: ${totalWallClock}ms (< 650ms expected), Order: [${actualOrder.join(' -> ')}]`
    );
  }

  // 9. Upper clamp verification: delay=99999 clamped to 15000ms
  // We fire this request and test its response metadata
  {
    console.log('  Testing upper clamp: delay=99999 (should clamp to 15000ms, awaiting 15s)...');
    const start99k = Date.now();
    const res = await fetchJson('/api/slow?delay=99999');
    const elapsed99k = Date.now() - start99k;
    const ok = res.status === 200 && res.body.delay === 15000 && elapsed99k >= 14800 && elapsed99k <= 16500;
    record('1.9 Upper bound clamp (delay=99999 clamped to 15000ms)', ok, `delay=${res.body?.delay}, elapsed=${elapsed99k}ms`);
  }
}

async function runSimulateErrorSuite() {
  console.log('\n=== Suite 2: GET /api/simulate-error — Bounds, Codes & Statistical Distribution ===');

  // 2.1 Boundary rate=-0.5 (clamped to 0.0 -> 100% success)
  {
    let allOk = true;
    for (let i = 0; i < 20; i++) {
      const res = await fetchJson('/api/simulate-error?rate=-0.5');
      if (res.status !== 200 || res.body.rate !== 0) {
        allOk = false;
        break;
      }
    }
    record('2.1 Lower rate boundary (rate=-0.5 clamped to 0.0, 20/20 success)', allOk, 'All 20 requests returned HTTP 200 with rate=0');
  }

  // 2.2 Boundary rate=0.0 (100% success)
  {
    let allOk = true;
    for (let i = 0; i < 20; i++) {
      const res = await fetchJson('/api/simulate-error?rate=0.0');
      if (res.status !== 200 || res.body.rate !== 0) {
        allOk = false;
        break;
      }
    }
    record('2.2 Zero rate boundary (rate=0.0, 20/20 success)', allOk, 'All 20 requests returned HTTP 200 with rate=0');
  }

  // 2.3 Boundary rate=1.0 (100% failure)
  {
    let allFailed = true;
    for (let i = 0; i < 20; i++) {
      const res = await fetchJson('/api/simulate-error?rate=1.0');
      if (res.status !== 500 || res.body.rate !== 1 || res.body.code !== 'SIMULATED_TRANSIENT_ERROR') {
        allFailed = false;
        break;
      }
    }
    record('2.3 Full failure boundary (rate=1.0, 20/20 failure)', allFailed, 'All 20 requests returned HTTP 500 with SIMULATED_TRANSIENT_ERROR');
  }

  // 2.4 Boundary rate=1.5 (clamped to 1.0 -> 100% failure)
  {
    let allFailed = true;
    for (let i = 0; i < 20; i++) {
      const res = await fetchJson('/api/simulate-error?rate=1.5');
      if (res.status !== 500 || res.body.rate !== 1) {
        allFailed = false;
        break;
      }
    }
    record('2.4 Upper rate boundary (rate=1.5 clamped to 1.0, 20/20 failure)', allFailed, 'All 20 requests returned HTTP 500 with rate=1');
  }

  // 2.5 Non-numeric rate=abc fallback to 0.3
  {
    const res = await fetchJson('/api/simulate-error?rate=abc');
    const ok = res.body.rate === 0.3;
    record('2.5 Non-numeric rate fallback (rate=abc defaults to 0.3)', ok, `rate=${res.body?.rate}`);
  }

  // 2.6 Custom status codes
  {
    const res503 = await fetchJson('/api/simulate-error?rate=1.0&statusCode=503');
    const ok503 = res503.status === 503 && res503.body.statusCode === 503;
    record('2.6.1 Custom status code HTTP 503 Service Unavailable', ok503, `status=${res503.status}`);

    const res429 = await fetchJson('/api/simulate-error?rate=1.0&statusCode=429');
    const ok429 = res429.status === 429 && res429.body.statusCode === 429;
    record('2.6.2 Custom status code HTTP 429 Too Many Requests', ok429, `status=${res429.status}`);

    const resInvalid = await fetchJson('/api/simulate-error?rate=1.0&statusCode=invalid');
    const okInvalid = resInvalid.status === 500 && resInvalid.body.statusCode === 500;
    record('2.6.3 Invalid status code fallback to HTTP 500', okInvalid, `status=${resInvalid.status}`);
  }

  // 2.7 Attempt parameter tracking
  {
    const resErr = await fetchJson('/api/simulate-error?rate=1.0&attempt=4');
    const resSucc = await fetchJson('/api/simulate-error?rate=0.0&attempt=7');
    const ok = resErr.body.attempt === 4 && resSucc.body.attempt === 7;
    record('2.7 Attempt parameter preservation in error and success responses', ok, `errAttempt=${resErr.body?.attempt}, succAttempt=${resSucc.body?.attempt}`);
  }

  // 2.8 Delay parameter on simulate-error
  {
    const res = await fetchJson('/api/simulate-error?rate=0.0&delay=150');
    const ok = res.status === 200 && res.elapsed >= 130 && res.elapsed <= 350;
    record('2.8 Delay parameter on simulate-error (delay=150ms)', ok, `elapsed=${res.elapsed}ms`);
  }

  // 2.9 Statistical distribution test: 100 requests at rate=0.3
  {
    console.log('  Executing statistical distribution test: 100 requests at rate=0.3...');
    let failures = 0;
    let successes = 0;
    const rolls = [];

    // Run in batches of 10 for speed
    for (let batch = 0; batch < 10; batch++) {
      const batchPromises = Array.from({ length: 10 }, () => fetchJson('/api/simulate-error?rate=0.3'));
      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        rolls.push(res.body.randomRoll);
        if (res.status === 500) failures++;
        else if (res.status === 200) successes++;
      }
    }

    const failureRate = failures / 100;
    // Expected ~0.30 (30%). With N=100, binomial std dev = sqrt(100 * 0.3 * 0.7) = 4.58.
    // 3-sigma confidence range is 30 +/- 14 -> [16%, 44%].
    const isWithinBounds = failures >= 15 && failures <= 45;

    record(
      '2.9 Statistical distribution: 100 requests at rate=0.3',
      isWithinBounds && (successes + failures === 100),
      `Failures: ${failures}/100 (${(failureRate * 100).toFixed(1)}%), Successes: ${successes}/100, Range expected: [15%, 45%]`
    );
  }
}

async function runLessonsSearchSuite() {
  console.log('\n=== Suite 3: GET /api/lessons — Global Search Filter & Edge Cases ===');

  // 3.1 Global search without courseId matching across multiple courses
  {
    const res = await fetchJson('/api/lessons?filter=Observable&pageSize=20');
    const courseIds = new Set(res.body.lessons?.map(l => l.courseId));
    const ok = res.status === 200 && res.body.total === 5 && courseIds.size === 3;
    record(
      '3.1 Global search without courseId matches across courses 1, 2, and 3',
      ok,
      `total=${res.body?.total}, distinctCourses=[${Array.from(courseIds).join(', ')}]`
    );
  }

  // 3.2 Search scoped to single courseId
  {
    const res = await fetchJson('/api/lessons?courseId=1&filter=Observable&pageSize=20');
    const allCourse1 = res.body.lessons?.every(l => l.courseId === 1);
    const ok = res.status === 200 && res.body.total === 3 && allCourse1;
    record('3.2 Search scoped to specific courseId=1', ok, `total=${res.body?.total}, allCourseId=1: ${allCourse1}`);
  }

  // 3.3 Invalid/NaN courseId treated as global search
  {
    const res = await fetchJson('/api/lessons?courseId=abc&filter=Observable&pageSize=20');
    const ok = res.status === 200 && res.body.total === 5;
    record('3.3 Non-numeric courseId=abc falls back to global search', ok, `total=${res.body?.total}`);
  }

  // 3.4 Nonexistent filter returns 200 with empty array (no crash)
  {
    const res = await fetchJson('/api/lessons?filter=xyznonexistentterm99');
    const ok = res.status === 200 && res.body.total === 0 && Array.isArray(res.body.lessons) && res.body.lessons.length === 0;
    record('3.4 Nonexistent filter returns empty array with HTTP 200', ok, `total=${res.body?.total}, length=${res.body?.lessons?.length}`);
  }

  // 3.5 Special characters in filter
  {
    const resSpace = await fetchJson('/api/lessons?filter=%20');
    const okSpace = resSpace.status === 200 && resSpace.body.total > 0;
    record('3.5.1 URL-encoded space (%20) filter handled cleanly', okSpace, `total=${resSpace.body?.total}`);

    const resPunct = await fetchJson('/api/lessons?filter=!%40%23%24');
    const okPunct = resPunct.status === 200 && resPunct.body.total === 0;
    record('3.5.2 Punctuation special characters (!@#$) return empty results without crash', okPunct, `status=${resPunct.status}, total=${resPunct.body?.total}`);
  }

  // 3.6 Pagination boundaries
  {
    const resP0 = await fetchJson('/api/lessons?pageSize=3&pageNumber=0');
    const resP1 = await fetchJson('/api/lessons?pageSize=3&pageNumber=1');
    const resP999 = await fetchJson('/api/lessons?pageSize=3&pageNumber=999');

    const okPages = resP0.body.lessons.length === 3 &&
                    resP1.body.lessons.length === 3 &&
                    resP0.body.lessons[0].id !== resP1.body.lessons[0].id &&
                    resP999.body.lessons.length === 0 &&
                    resP999.status === 200;

    record('3.6 Pagination bounds: valid pages distinct, page 999 returns empty array', okPages, `page0Len=${resP0.body.lessons.length}, page1Len=${resP1.body.lessons.length}, page999Len=${resP999.body.lessons.length}`);
  }

  // 3.7 Sorting parameter
  {
    const resAsc = await fetchJson('/api/lessons?courseId=1&sortOrder=asc&pageSize=8');
    const resDesc = await fetchJson('/api/lessons?courseId=1&sortOrder=desc&pageSize=8');
    const ascSeq = resAsc.body.lessons.map(l => l.seqNo);
    const descSeq = resDesc.body.lessons.map(l => l.seqNo);
    const isSortedAsc = ascSeq[0] === 1 && ascSeq[7] === 8;
    const isSortedDesc = descSeq[0] === 8 && descSeq[7] === 1;
    record('3.7 Sorting parameter: sortOrder=asc vs desc correctly inverts sequence numbers', isSortedAsc && isSortedDesc, `asc=[${ascSeq.slice(0,3)}...], desc=[${descSeq.slice(0,3)}...]`);
  }
}

async function runRegressionSuite() {
  console.log('\n=== Suite 4: Existing Routes Regression & State Mutation Integrity ===');

  // 4.1 Root endpoint GET /
  {
    const res = await fetchJson('/');
    const ok = res.status === 200 && res.body.message === 'REST API is running' && Array.isArray(res.body.endpoints) && res.body.endpoints.length === 5;
    record('4.1 Root catalog GET / returns all 5 endpoints', ok, `endpointsCount=${res.body?.endpoints?.length}`);
  }

  // 4.2 GET /api/courses/1
  {
    const res = await fetchJson('/api/courses/1');
    const ok = res.status === 200 && res.body.id === 1 && res.body.category === 'BEGINNER' && Array.isArray(res.body.lessons) && res.body.lessons.length === 8;
    record('4.2 Existing route GET /api/courses/1 returns Course 1 with 8 lessons', ok, `id=${res.body?.id}, lessonsCount=${res.body?.lessons?.length}`);
  }

  // 4.3 GET /api/courses/9999 (404 Not Found)
  {
    const res = await fetchJson('/api/courses/9999');
    const ok = res.status === 404 && res.body.message === 'Course 9999 was not found';
    record('4.3 Route error path GET /api/courses/9999 returns HTTP 404', ok, `status=${res.status}, msg="${res.body?.message}"`);
  }

  // 4.4 PUT /api/courses/1 (state modification and revert)
  {
    const originalDesc = 'RxJS Fundamentals';
    const mutatedDesc = 'RxJS Fundamentals - Challenger Empirical Test';

    // Apply update
    const putRes = await fetchJson('/api/courses/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: mutatedDesc })
    });
    const putOk = putRes.status === 200 && putRes.body.description === mutatedDesc;

    // Verify GET reflects update
    const getRes = await fetchJson('/api/courses/1');
    const getReflected = getRes.body.description === mutatedDesc;

    // Revert state
    const revertRes = await fetchJson('/api/courses/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: originalDesc })
    });
    const reverted = revertRes.status === 200 && revertRes.body.description === originalDesc;

    record('4.4 Existing route PUT /api/courses/1 mutates state, confirms persistence, and reverts cleanly', putOk && getReflected && reverted, `putOk=${putOk}, getReflected=${getReflected}, reverted=${reverted}`);
  }

  // 4.5 CORS header verification
  {
    const res = await fetchJson('/api/slow?delay=0');
    const hasCors = res.headers['access-control-allow-origin'] === '*';
    record('4.5 CORS enabled (Access-Control-Allow-Origin: *) across endpoints', hasCors, `corsHeader=${res.headers['access-control-allow-origin']}`);
  }
}

async function main() {
  console.log('==============================================================================');
  console.log('  CHALLENGER 2: EMPIRICAL ADVERSARIAL BACKEND STRESS TEST SUITE');
  console.log('==============================================================================\n');

  try {
    await startServer();

    await runSlowEndpointSuite();
    await runSimulateErrorSuite();
    await runLessonsSearchSuite();
    await runRegressionSuite();

    console.log('\n==============================================================================');
    console.log('  EMPIRICAL TEST SUMMARY');
    console.log('==============================================================================');
    console.log(`  Total Executed : ${results.tests.length}`);
    console.log(`  Passed         : ${results.passed}`);
    console.log(`  Failed         : ${results.failed}`);
    console.log('==============================================================================\n');

    if (results.failed > 0) {
      console.error(`Verdict: REQUEST_CHANGES (${results.failed} tests failed)`);
      process.exitCode = 1;
    } else {
      console.log('Verdict: APPROVE (100% tests passed empirically)');
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Fatal Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    stopServer();
  }
}

main();
