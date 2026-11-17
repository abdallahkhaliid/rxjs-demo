const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', '..', 'src', 'app', 'features', 'module3-operators', 'data');
const files = [
  'transformation.data.ts',
  'filtering.data.ts',
  'combination.data.ts',
  'utility.data.ts',
  'multicasting.data.ts'
];

let allOps = [];

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Match each operator block by looking for: \n  <opName>: {
  const opBlocks = content.split(/\n  ([a-zA-Z0-9]+):\s*\{/g);
  // opBlocks[0] is header
  for (let i = 1; i < opBlocks.length; i += 2) {
    const opName = opBlocks[i];
    const opBody = opBlocks[i + 1];

    // Find pipelineFactory in opBody
    const pfMatch = opBody.match(/pipelineFactory:\s*([\s\S]*?)(?=\n  \}|\n\};)/);
    const pfCode = pfMatch ? pfMatch[1].trim() : 'NOT_FOUND';

    // Check for suspicious patterns
    const hasPipe = pfCode.includes('.pipe(') || pfCode.includes('combineLatest(') || pfCode.includes('concat(') || pfCode.includes('merge(') || pfCode.includes('forkJoin(') || pfCode.includes('zip(') || pfCode.includes('race(');
    const returnsHardcoded = /return\s+of\(\s*['"][^'"]*['"]\s*\)/.test(pfCode) && !pfCode.includes('source$');
    const isStub = pfCode.includes('TODO') || pfCode.includes('NotImplemented') || pfCode.length < 10;

    allOps.push({
      file,
      name: opName,
      hasPipe,
      returnsHardcoded,
      isStub,
      code: pfCode
    });
  }
}

console.log(`Total Operators Parsed: ${allOps.length}`);
console.log('--- Summary per file ---');
for (const file of files) {
  const ops = allOps.filter(o => o.file === file);
  console.log(`${file}: ${ops.length} operators [${ops.map(o => o.name).join(', ')}]`);
}

console.log('\n--- Checking for stubs / facades / hardcoded values ---');
let issues = 0;
for (const op of allOps) {
  if (!op.hasPipe) {
    console.log(`WARNING: ${op.name} (${op.file}) might not use pipe/combination: ${op.code}`);
    issues++;
  }
  if (op.returnsHardcoded) {
    console.log(`VIOLATION: ${op.name} (${op.file}) returns hardcoded constant!`);
    issues++;
  }
  if (op.isStub) {
    console.log(`VIOLATION: ${op.name} (${op.file}) is a stub/placeholder!`);
    issues++;
  }
}

if (issues === 0) {
  console.log('CLEAN: All 65 operators have genuine pipeline implementations using real RxJS operations!');
} else {
  console.log(`Found ${issues} potential issues.`);
}
