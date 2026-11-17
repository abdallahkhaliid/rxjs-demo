const { MODULE3_OPERATORS } = require('../../../src/app/features/module3-operators/module3.data');

console.log('Total operators count:', Object.keys(MODULE3_OPERATORS).length);

const categories = {};
for (const [id, op] of Object.entries(MODULE3_OPERATORS)) {
  categories[op.category] = (categories[op.category] || 0) + 1;
}
console.log('Categories breakdown:', categories);
