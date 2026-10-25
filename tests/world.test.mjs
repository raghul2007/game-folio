import { buildGrid, treeBlocked, findPath, nearestWalkable } from '../public/js/nav.js';
import { MISSIONS, TOKENS, NPC_ROUTES } from '../public/js/data.js';
const g = treeBlocked(buildGrid());
let fail = 0; const bad = (m) => { console.log('FAIL', m); fail++; };
const spawn = { x: 32, y: 40 };
if (g[spawn.y][spawn.x]) bad('spawn blocked');
for (const m of MISSIONS) {
  const d = m.door;
  if (g[d.y][d.x]) bad(`door blocked ${m.id}`);
  const p = findPath(g, spawn.x, spawn.y, d.x, d.y);
  if (!p) bad(`door unreachable ${m.id}`); else console.log('ok', m.id, 'path', p.length);
}
for (const t of TOKENS) { if (g[t.y][t.x]) bad('token blocked ' + t.id); else if (!findPath(g, 32, 40, t.x, t.y)) bad('token unreachable ' + t.id); }
NPC_ROUTES.forEach((r, i) => r.forEach(([x, y]) => { if (g[y][x]) bad(`npc ${i} waypoint blocked ${x},${y}`); }));
console.log(fail ? `${fail} failures` : 'world OK');
process.exit(fail ? 1 : 0);
