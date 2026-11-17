const { MODULE3_OPERATORS } = require('../../../src/app/features/module3-operators/module3.data');

console.log('--- Checking all 65 descriptions & summaries ---');
for (const [id, op] of Object.entries(MODULE3_OPERATORS)) {
  const topDesc = op.description || '';
  const metaDesc = op.metadata?.description || '';
  const topSumm = op.summary || '';
  const metaSumm = op.metadata?.summary || '';
  if (topDesc.length < 15 || metaDesc.length < 15) {
    console.log(`[SHORT DESC] ${id}: top="${topDesc}" (${topDesc.length}), meta="${metaDesc}" (${metaDesc.length})`);
  }
}
console.log('Done checking descriptions.');
