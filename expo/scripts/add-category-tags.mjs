// One-off data migration: adds category tags to built-in peaks in
// constants/mountains.ts.
//
//  - himalaya tag on the 14 eight-thousanders that sit in the Himalaya
//    (everest keeps its 7summits category but is tagged himalaya)
//  - volcanic tag on the volcano peaks (merged with any existing tags)
//  - rakaposhi: Karakoram, not Himalaya — category himalaya → other
//
// Idempotent: tags are only added when missing. Run: node scripts/add-category-tags.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'constants', 'mountains.ts');

const HIMALAYA = [
  'everest', 'kangchenjunga', 'lhotse', 'makalu', 'cho-oyu', 'dhaulagiri',
  'manaslu', 'nanga-parbat', 'annapurna', 'shishapangma',
];

const VOLCANIC = [
  'kilimanjaro', 'elbrus', 'chimborazo', 'cotopaxi', 'sajama', 'volcan-lanin',
  'mt-rainier', 'mt-hood', 'mt-shasta', 'mt-fuji', 'mt-kenya', 'mt-elbrus-west',
  'orizaba', 'iztaccihuatl', 'mt-baker', 'volcano-teide', 'mt-elbrus-traverse',
  'iliniza-sur', 'iliniza-norte', 'cayambe', 'popocatepetl', 'mt-st-helens',
  'mt-meru-tanzania', 'mount-rinjani', 'mount-agung', 'mount-mayon',
  'mount-vesuvius', 'villarrica', 'mount-taranaki', 'mount-ngauruhoe',
  'mount-erebus', 'sakurajima', 'antisana', 'el-altar', 'mount-etna', 'mauna-kea',
];

let src = readFileSync(file, 'utf8');

// --- Rakaposhi: Karakoram, not Himalaya ---
const rakaposhiBlock = src.match(/\{\s*\n\s*id: 'rakaposhi',[\s\S]*?\n  \},/);
if (!rakaposhiBlock) throw new Error('rakaposhi block not found');
const fixedRakaposhi = rakaposhiBlock[0].replace(
  /category: 'himalaya',/,
  "category: 'other',"
);
if (fixedRakaposhi === rakaposhiBlock[0]) {
  console.log('rakaposhi: category already not himalaya');
}
src = src.replace(rakaposhiBlock[0], fixedRakaposhi);

// --- Tag insertion ---
function addTag(id, tag) {
  const blockRe = new RegExp(`\\{\\s*\\n\\s*id: '${id}',[\\s\\S]*?\\n  \\},`);
  const block = src.match(blockRe);
  if (!block) throw new Error(`mountain not found: ${id}`);
  let updated = block[0];

  const tagsLineRe = /(\n    tags: \[)([^\]]*)(\]),/;
  if (tagsLineRe.test(updated)) {
    if (!updated.includes(`'${tag}'`)) {
      updated = updated.replace(tagsLineRe, (_m, a, b, c) => `${a}${b}${b.trim() ? ', ' : ''}'${tag}'${c}),`);
    }
  } else {
    const catLineRe = /(\n    category: '[^']+',)/;
    if (!catLineRe.test(updated)) throw new Error(`category line not found for ${id}`);
    updated = updated.replace(catLineRe, `$1\n    tags: ['${tag}'],`);
  }

  src = src.replace(block[0], updated);
}

for (const id of HIMALAYA) addTag(id, 'himalaya');
for (const id of VOLCANIC) addTag(id, 'volcanic');

writeFileSync(file, src);

const tagCount = (src.match(/tags: \[/g) ?? []).length;
console.log(`done — mountains.ts now has ${tagCount} tagged peaks`);
