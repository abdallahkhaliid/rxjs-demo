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

const operators = [];

for (const file of files) {
  const filePath = path.join(dataDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  let currentId = null;
  let capturing = false;
  let buffer = [];
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const idMatch = line.match(/^\s*id:\s*['"]([^'"]+)['"]/);
    if (idMatch) {
      currentId = idMatch[1];
    }
    if (line.includes('pipelineFactory:')) {
      capturing = true;
      buffer = [line.trim()];
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;
      braceCount = opens - closes;
      if (braceCount <= 0 && line.includes('=>') && !line.includes('{')) {
        capturing = false;
        operators.push({ file, id: currentId, code: buffer.join(' ') });
        buffer = [];
      }
      continue;
    }
    if (capturing) {
      buffer.push(line.trim());
      const opens = (line.match(/\{/g) || []).length;
      const closes = (line.match(/\}/g) || []).length;
      braceCount += (opens - closes);
      if (braceCount <= 0) {
        capturing = false;
        operators.push({ file, id: currentId, code: buffer.join(' ') });
        buffer = [];
      }
    }
  }
}

console.log(`Audited ${operators.length} operators across ${files.length} files:\n`);
for (const op of operators) {
  console.log(`[${op.file}] ${op.id}:`);
  console.log(`  ${op.code}\n`);
}
