const fs = require('fs');
const path = require('path');
const { of, Subject, isObservable } = require('rxjs');
const { toArray, take } = require('rxjs/operators');
const { MODULE3_OPERATORS } = require('../../../src/app/features/module3-operators/module3.data');

console.log('=== STARTING FORENSIC DEEP AUDIT OF MODULE 3 ===\n');

let issues = [];
let passCount = 0;

// 1. Check all 65 operators exist
const operatorKeys = Object.keys(MODULE3_OPERATORS);
if (operatorKeys.length !== 65) {
  issues.push(`Expected 65 operators, found ${operatorKeys.length}`);
} else {
  console.log(`[PASS] Verified operator count = 65`);
  passCount++;
}

// 2. Deprecated operators verification
const expectedDeprecated = ['mapTo', 'pluck', 'repeatWhen', 'retryWhen', 'multicast', 'publish', 'refCount'];
const foundDeprecated = [];

for (const id of operatorKeys) {
  const op = MODULE3_OPERATORS[id];
  const meta = op.metadata;
  
  if (meta.isDeprecated || op.isDeprecated) {
    foundDeprecated.push(id);
    if (!meta.deprecationNotice || meta.deprecationNotice.length < 15) {
      issues.push(`Operator ${id} has isDeprecated=true but missing/short deprecationNotice`);
    }
    if (!meta.modernAlternative || meta.modernAlternative.length < 2) {
      issues.push(`Operator ${id} has isDeprecated=true but missing modernAlternative`);
    }
  }
}

console.log('Found deprecated operators:', foundDeprecated);
const missingDep = expectedDeprecated.filter(d => !foundDeprecated.includes(d));
if (missingDep.length > 0) {
  issues.push(`Missing deprecated flags for: ${missingDep.join(', ')}`);
} else {
  console.log(`[PASS] All 7 expected deprecated operators correctly flagged with notice and modern alternative`);
  passCount++;
}

// Check refCount description
const refCountOp = MODULE3_OPERATORS['refCount'];
if (!refCountOp.metadata.description.toLowerCase().includes('deprecated') ||
    !refCountOp.metadata.description.toLowerCase().includes('share()')) {
  issues.push(`refCount description does not mention deprecation in favor of share(): ${refCountOp.metadata.description}`);
} else {
  console.log(`[PASS] refCount description explicitly warns about deprecation and share()`);
  passCount++;
}

// 3. Metadata quality verification for all 65 operators
const syntheticPatterns = [/lorem/i, /dummy/i, /todo/i, /placeholder/i, /test\s*usecase/i, /test\s*pitfall/i, /asdf/i, /xxx/i];

let lowQualityCount = 0;
for (const id of operatorKeys) {
  const op = MODULE3_OPERATORS[id];
  const meta = op.metadata;

  // useCases >= 2
  if (!meta.useCases || meta.useCases.length < 2) {
    issues.push(`Operator ${id}: useCases count is ${meta.useCases ? meta.useCases.length : 0} (expected >= 2)`);
    lowQualityCount++;
  } else {
    for (const uc of meta.useCases) {
      if (uc.length < 10) {
        issues.push(`Operator ${id}: useCase too short ("${uc}")`);
        lowQualityCount++;
      }
      for (const pat of syntheticPatterns) {
        if (pat.test(uc)) {
          issues.push(`Operator ${id}: useCase matches synthetic pattern ${pat}: "${uc}"`);
          lowQualityCount++;
        }
      }
    }
  }

  // pitfalls >= 1
  if (!meta.pitfalls || meta.pitfalls.length < 1) {
    issues.push(`Operator ${id}: pitfalls count is ${meta.pitfalls ? meta.pitfalls.length : 0} (expected >= 1)`);
    lowQualityCount++;
  } else {
    for (const pf of meta.pitfalls) {
      if (pf.length < 10) {
        issues.push(`Operator ${id}: pitfall too short ("${pf}")`);
        lowQualityCount++;
      }
      for (const pat of syntheticPatterns) {
        if (pat.test(pf)) {
          issues.push(`Operator ${id}: pitfall matches synthetic pattern ${pat}: "${pf}"`);
          lowQualityCount++;
        }
      }
    }
  }

  // relatedOperators >= 1
  if (!meta.relatedOperators || meta.relatedOperators.length < 1) {
    issues.push(`Operator ${id}: relatedOperators count < 1`);
  }

  // docUrl
  if (!meta.docUrl || !meta.docUrl.startsWith('https://rxjs.dev/api/')) {
    issues.push(`Operator ${id}: docUrl invalid ("${meta.docUrl}")`);
  }

  // summary & description
  if (!meta.summary || meta.summary.length < 15) {
    issues.push(`Operator ${id}: summary missing or too short`);
  }
  if (!meta.description || meta.description.length < 20) {
    issues.push(`Operator ${id}: description missing or too short`);
  }
}

if (lowQualityCount === 0) {
  console.log(`[PASS] Metadata quality verification passed for all 65 operators (authentic educational text, no synthetic placeholders)`);
  passCount++;
}

// 4. PipelineFactory Authenticity & Execution Verification
console.log('\n--- Auditing pipelineFactory implementations ---');
let factoryIssues = 0;

for (const id of operatorKeys) {
  const op = MODULE3_OPERATORS[id];
  const factory = op.pipelineFactory;
  
  if (typeof factory !== 'function') {
    issues.push(`Operator ${id}: pipelineFactory is not a function`);
    factoryIssues++;
    continue;
  }

  const factoryStr = factory.toString();
  // Check if it just returns source or constant without using rxjs operators
  // Check for common facade patterns:
  // "return source$" with no pipe
  // "return of(" with no operator logic
  if (/return\s+source\$\s*;/.test(factoryStr) && !factoryStr.includes('.pipe(')) {
    issues.push(`Operator ${id}: pipelineFactory appears to be a facade (returns source$ directly without piping)`);
    factoryIssues++;
  }

  // Try executing the pipeline with a test observable
  try {
    const defaultParams = {};
    for (const p of (op.parameters || [])) {
      defaultParams[p.id] = p.defaultValue;
    }
    const mockContext = {
      notifier$: new Subject(),
      secondSource$: of(10, 20, 30),
      allSources: [of(1, 2, 3), of(10, 20, 30)]
    };
    const testSource$ = of(1, 2, 3, 4, 5);
    const result$ = factory(testSource$, defaultParams, mockContext);
    
    if (!isObservable(result$)) {
      issues.push(`Operator ${id}: pipelineFactory did not return an Observable`);
      factoryIssues++;
    }
  } catch (err) {
    // Some operators might need special context/parameters (e.g. notifier or specific types)
    // We log and check carefully
    issues.push(`Operator ${id}: invocation failed with error: ${err.message}`);
    factoryIssues++;
  }
}

if (factoryIssues === 0) {
  console.log(`[PASS] All 65 pipelineFactory instances are authentic functions returning Observables`);
  passCount++;
} else {
  console.log(`[WARN/FAIL] Found ${factoryIssues} pipelineFactory issues`);
}

// 5. Check takeLast timeline spacing
const takeLastOp = MODULE3_OPERATORS['takeLast'];
if (takeLastOp && takeLastOp.initialMarbles && takeLastOp.initialMarbles.outputStream) {
  const out = takeLastOp.initialMarbles.outputStream;
  const times = out.emissions.map(e => e.timeMs);
  const distinctTimes = new Set(times);
  if (times.length !== distinctTimes.size) {
    issues.push(`takeLast output emissions have overlapping timestamps: ${JSON.stringify(times)}`);
  } else if (out.completedAtMs <= Math.max(...times)) {
    issues.push(`takeLast completedAtMs (${out.completedAtMs}) is not strictly after last emission (${Math.max(...times)})`);
  } else {
    console.log(`[PASS] takeLast initialMarbles spacing verified: times=${JSON.stringify(times)}, completedAtMs=${out.completedAtMs}`);
    passCount++;
  }
} else {
  issues.push('takeLast operator initialMarbles not found');
}

console.log('\n=== AUDIT SUMMARY ===');
console.log(`Total checks passed: ${passCount}`);
console.log(`Total issues found: ${issues.length}`);
if (issues.length > 0) {
  console.log('Issues:', issues);
}
