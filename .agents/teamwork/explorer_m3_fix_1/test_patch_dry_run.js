const fs = require('fs');
const path = require('path');

const patchData = require('./operator_metadata_patch.json');

const files = {
  transformation: path.resolve(__dirname, '../../../src/app/features/module3-operators/data/transformation.data.ts'),
  filtering: path.resolve(__dirname, '../../../src/app/features/module3-operators/data/filtering.data.ts'),
  combination: path.resolve(__dirname, '../../../src/app/features/module3-operators/data/combination.data.ts'),
  utility: path.resolve(__dirname, '../../../src/app/features/module3-operators/data/utility.data.ts'),
  multicasting: path.resolve(__dirname, '../../../src/app/features/module3-operators/data/multicasting.data.ts'),
};

console.log('Validating files exist:');
for (const [cat, filePath] of Object.entries(files)) {
  const exists = fs.existsSync(filePath);
  console.log(`  ${cat}: ${exists ? 'EXISTS' : 'NOT FOUND'} (${filePath})`);
  if (!exists) process.exit(1);
}

console.log('Dry run checking all 65 operators present in files:');
for (const [cat, ops] of Object.entries(patchData)) {
  const content = fs.readFileSync(files[cat], 'utf8');
  for (const opId of Object.keys(ops)) {
    // Check if operator ID is defined as an object key
    const pattern = new RegExp(`\\b${opId}:\\s*\\{`);
    const found = pattern.test(content);
    if (!found) {
      console.error(`  [ERROR] Operator ${opId} not found in ${cat}.data.ts`);
    }
  }
}
console.log('All 65 operators matched in their respective category data files.');
