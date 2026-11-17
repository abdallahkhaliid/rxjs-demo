const fs = require('fs');
const path = require('path');
const { MODULE3_OPERATORS } = require('../../../src/app/features/module3-operators/module3.data');

const dataFiles = [
  'transformation.data.ts',
  'filtering.data.ts',
  'combination.data.ts',
  'utility.data.ts',
  'multicasting.data.ts'
];

const basePath = path.join(__dirname, '../../../src/app/features/module3-operators/data');

console.log('--- RxJS Imports in Data Files ---');
for (const f of dataFiles) {
  const content = fs.readFileSync(path.join(basePath, f), 'utf-8');
  const importLines = content.split('\n').filter(l => l.includes("from 'rxjs") || l.includes('from "rxjs'));
  console.log(`\nFile ${f}:`);
  importLines.forEach(l => console.log('  ' + l.trim()));
}

console.log('\n--- PipelineFactory implementations check ---');
for (const [id, op] of Object.entries(MODULE3_OPERATORS)) {
  const fnStr = op.pipelineFactory.toString();
  // Check if fnStr references genuine rxjs pipeline or operators
  console.log(`${id.padEnd(20)}: ${fnStr.replace(/\s+/g, ' ').substring(0, 100)}`);
}
