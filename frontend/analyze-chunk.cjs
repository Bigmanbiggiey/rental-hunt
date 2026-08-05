// Sprint 8 (Quality Assurance) bundle investigation — lists a chunk's
// largest modules by rendered/gzip size, using the raw-data output
// vite.config.ts's rollup-plugin-visualizer produces (ANALYZE=1-gated,
// zero effect on a normal build).
//
// Usage:
//   ANALYZE=1 npm run build          # produces dist/stats.json
//   node analyze-chunk.cjs <chunkName> [topN=25]
//
// <chunkName> is the tree node's own name, which includes the "assets/"
// prefix and content hash exactly as emitted, e.g.
// "assets/index-BtsxqQBG.js" — not just "index.js". Run with no
// arguments (or an unmatched name) to print every available chunk name.
const fs = require('fs');

const STATS_PATH = 'dist/stats.json';
if (!fs.existsSync(STATS_PATH)) {
  console.error(`${STATS_PATH} not found — run "ANALYZE=1 npm run build" first.`);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));

const targetName = process.argv[2];
const topN = Number(process.argv[3] || 25);

// Build partUid -> real module id lookup (nodeMetas is keyed by module uid,
// but tree leaves / nodeParts are keyed by the per-chunk "part" uid found in
// each module's moduleParts map).
const partUidToModuleId = {};
for (const key of Object.keys(data.nodeMetas)) {
  const meta = data.nodeMetas[key];
  if (!meta.moduleParts) continue;
  for (const [, partUid] of Object.entries(meta.moduleParts)) {
    partUidToModuleId[partUid] = meta.id;
  }
}

function collectLeaves(node, out) {
  if (node.uid) out.push(node);
  if (node.children) {
    for (const c of node.children) collectLeaves(c, out);
  }
}

const chunkRoot = targetName ? data.tree.children.find((c) => c.name === targetName) : null;
if (!chunkRoot) {
  if (targetName) console.error('Chunk not found:', targetName, '\n');
  console.error('Available chunks:');
  for (const c of data.tree.children) console.error(' ', c.name);
  process.exit(1);
}

const leaves = [];
collectLeaves(chunkRoot, leaves);

const rows = leaves.map((leaf) => {
  const part = data.nodeParts[leaf.uid];
  return {
    id: partUidToModuleId[leaf.uid] || leaf.uid,
    rendered: part ? part.renderedLength : 0,
    gzip: part ? part.gzipLength : 0,
  };
});

rows.sort((a, b) => b.rendered - a.rendered);

let total = 0;
for (const r of rows) total += r.rendered;

console.log(`Chunk: ${targetName}`);
console.log(`Total modules: ${rows.length}, total rendered size: ${(total / 1024).toFixed(1)} kB`);
console.log('---');
for (const r of rows.slice(0, topN)) {
  console.log(`${(r.rendered / 1024).toFixed(2).padStart(8)} kB  ${r.id}`);
}
