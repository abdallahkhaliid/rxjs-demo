/**
 * Automated Patch Script for Milestone 3 Operator Data Layer Remediation
 * 
 * Usage:
 *   node .agents/teamwork/explorer_m3_fix_1/apply_operator_patches.js [--dry-run]
 * 
 * This script updates the 5 category data files:
 *   1. transformation.data.ts (18 operators)
 *   2. filtering.data.ts (19 operators + takeLast coordinate fix)
 *   3. combination.data.ts (11 operators)
 *   4. utility.data.ts (12 operators)
 *   5. multicasting.data.ts (5 operators + refCount description update)
 * 
 * Injecting:
 *   - useCases (2-3 per operator)
 *   - pitfalls (1-2 per operator)
 *   - relatedOperators (2-4 per operator)
 *   - docUrl (official RxJS documentation)
 *   - isDeprecated, deprecationNotice, modernAlternative (for 7 deprecated operators)
 */

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

const isDryRun = process.argv.includes('--dry-run');

function formatArray(arr, indent = '      ') {
  return '[\n' + arr.map(item => `${indent}  ${JSON.stringify(item)}`).join(',\n') + `\n${indent}]`;
}

function patchCategoryFile(category, filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const catPatches = patchData[category];
  if (!catPatches) {
    console.error(`Unknown category ${category}`);
    return;
  }

  let patchedCount = 0;

  for (const [opId, patch] of Object.entries(catPatches)) {
    // 1. If operator is refCount in multicasting, update description
    if (opId === 'refCount' && category === 'multicasting') {
      if (patch.updatedDescription) {
        content = content.replace(
          /description:\s*'Piped onto a ConnectableObservable[^']*'/,
          `description: ${JSON.stringify(patch.updatedDescription)}`
        );
      }
    }

    // 2. If operator is takeLast in filtering, fix outputStream coordinate collision
    if (opId === 'takeLast' && category === 'filtering') {
      content = content.replace(
        /outputStream:\s*\{\s*id:\s*'out',\s*label:\s*'takeLast\(2\)',\s*emissions:\s*\[\{\s*id:\s*'o1',\s*timeMs:\s*700,\s*value:\s*2,\s*displayLabel:\s*'2'\s*\},\s*\{\s*id:\s*'o2',\s*timeMs:\s*700,\s*value:\s*3,\s*displayLabel:\s*'3'\s*\}\],\s*completedAtMs:\s*700\s*\}/,
        `outputStream: { id: 'out', label: 'takeLast(2)', emissions: [{ id: 'o1', timeMs: 700, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 900, value: 3, displayLabel: '3' }], completedAtMs: 1100 }`
      );
    }

    // 3. Locate operator block and its metadata block
    // We look for:
    //   opId: { ... metadata: { ... difficulty: '...' [existing metadata fields] }
    // We want to replace inside metadata: { ... }
    
    // Find the operator definition start
    const opDefIndex = content.indexOf(`\n  ${opId}: {`);
    if (opDefIndex === -1 && !content.startsWith(`${opId}: {`)) {
      console.warn(`Could not find operator start for ${opId} in ${category}`);
      continue;
    }

    // Find metadata: { ... } within this operator
    const searchFrom = opDefIndex === -1 ? 0 : opDefIndex;
    const metadataMatch = content.slice(searchFrom).match(/metadata:\s*\{([^}]+)\}/);
    if (!metadataMatch) {
      console.warn(`Could not find metadata block for ${opId} in ${category}`);
      continue;
    }

    const originalMetadataBlock = metadataMatch[0];
    const metadataInner = metadataMatch[1];

    // Build replacement metadata block
    let newMetadataInner = metadataInner.trimEnd();

    // Check if useCases is already in metadata
    if (!newMetadataInner.includes('useCases:')) {
      newMetadataInner += `,\n      useCases: ${formatArray(patch.useCases)}`;
    } else if (opId === 'map') {
      // map already has useCases, ensure high quality
      // leave intact or update
    }

    // Check if pitfalls is already in metadata
    if (!newMetadataInner.includes('pitfalls:')) {
      newMetadataInner += `,\n      pitfalls: ${formatArray(patch.pitfalls)}`;
    }

    // Check if relatedOperators is in metadata
    if (!newMetadataInner.includes('relatedOperators:')) {
      newMetadataInner += `,\n      relatedOperators: ${JSON.stringify(patch.relatedOperators)}`;
    }

    // Check if docUrl is in metadata
    if (!newMetadataInner.includes('docUrl:')) {
      newMetadataInner += `,\n      docUrl: ${JSON.stringify(patch.docUrl)}`;
    }

    // Check deprecation
    if (patch.isDeprecated) {
      if (!newMetadataInner.includes('isDeprecated:')) {
        newMetadataInner += `,\n      isDeprecated: true`;
      }
      if (!newMetadataInner.includes('deprecationNotice:')) {
        newMetadataInner += `,\n      deprecationNotice: ${JSON.stringify(patch.deprecationNotice)}`;
      }
      if (!newMetadataInner.includes('modernAlternative:')) {
        newMetadataInner += `,\n      modernAlternative: ${JSON.stringify(patch.modernAlternative)}`;
      }
    }

    const newMetadataBlock = `metadata: {\n${newMetadataInner}\n    }`;

    // Also at root level of OperatorDefinition, ensure useCases and pitfalls exist
    // Check if root already has useCases:
    // (If not, we can inject useCases, pitfalls, relatedOperators, docUrl, isDeprecated before comparison: or quiz: or metadata:)
    let opBlockSlice = content.slice(searchFrom, searchFrom + metadataMatch.index);
    let extraRootFields = '';
    if (!opBlockSlice.includes('useCases:') && opId !== 'map' && opId !== 'mapTo') {
      extraRootFields += `    useCases: ${formatArray(patch.useCases, '    ')},\n`;
      extraRootFields += `    pitfalls: ${formatArray(patch.pitfalls, '    ')},\n`;
      extraRootFields += `    relatedOperators: ${JSON.stringify(patch.relatedOperators)},\n`;
      extraRootFields += `    docUrl: ${JSON.stringify(patch.docUrl)},\n`;
      if (patch.isDeprecated) {
        extraRootFields += `    isDeprecated: true,\n`;
        extraRootFields += `    deprecationNotice: ${JSON.stringify(patch.deprecationNotice)},\n`;
        extraRootFields += `    modernAlternative: ${JSON.stringify(patch.modernAlternative)},\n`;
      }
    } else if (opId === 'mapTo') {
      // mapTo has root useCases, add deprecation metadata to root
      if (!opBlockSlice.includes('isDeprecated:')) {
        extraRootFields = `    isDeprecated: true,\n    deprecationNotice: ${JSON.stringify(patch.deprecationNotice)},\n    modernAlternative: ${JSON.stringify(patch.modernAlternative)},\n`;
      }
    }

    // Replace in content
    const fullOriginal = originalMetadataBlock;
    const fullReplacement = (extraRootFields ? extraRootFields + '    ' : '') + newMetadataBlock;

    const absoluteMetadataStart = searchFrom + metadataMatch.index;
    content = content.slice(0, absoluteMetadataStart) + fullReplacement + content.slice(absoluteMetadataStart + fullOriginal.length);

    patchedCount++;
  }

  console.log(`[${category}] Patched ${patchedCount} operators in ${path.basename(filePath)}`);

  if (!isDryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log(`Starting patch execution (${isDryRun ? 'DRY-RUN' : 'LIVE'})...`);
for (const [cat, filePath] of Object.entries(files)) {
  patchCategoryFile(cat, filePath);
}
console.log('Patch process complete!');
