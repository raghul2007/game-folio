// Grid utilities: collision grid + A* pathfinding (8-direction, no corner cutting).
import { MAP, MISSIONS } from './data.js';

export function buildGrid() {
  const { cols, rows } = MAP;
  const blocked = Array.from({ length: rows }, () => new Uint8Array(cols));
  const block = (x, y, w, h) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < cols && j < rows) blocked[j][i] = 1;
  };
  // outer boundary
  block(0, 0, cols, 2); block(0, rows - 2, cols, 2); block(0, 0, 2, rows); block(cols - 2, 0, 2, rows);
  // campus compound wall with the main gate opening (x 30..33)
  block(2, 36, 26, 2); block(36, 36, 26, 2);
  // gate pillars
  block(28, 34, 2, 4); block(34, 34, 2, 4);
  // buildings
  for (const m of MISSIONS) if (m.rect) block(m.rect.x, m.rect.y, m.rect.w, m.rect.h);
  // fountain and street furniture
  block(31, 30, 2, 2);
  for (const b of FURNITURE) block(b.x, b.y, b.w, b.h);
  return blocked;
}

// benches / planters / gazebo posts. Player cannot walk through them.
export const FURNITURE = [
  { x: 40, y: 31, w: 3, h: 1, kind: 'bench' }, { x: 40, y: 34, w: 3, h: 1, kind: 'bench' },
  { x: 41, y: 32, w: 1, h: 2, kind: 'table' },
  { x: 21, y: 21, w: 2, h: 1, kind: 'planter' }, { x: 41, y: 21, w: 2, h: 1, kind: 'planter' },
  { x: 21, y: 9, w: 2, h: 1, kind: 'planter' }, { x: 41, y: 9, w: 2, h: 1, kind: 'planter' },
  { x: 24, y: 24, w: 2, h: 1, kind: 'bench' }, { x: 38, y: 24, w: 2, h: 1, kind: 'bench' },
  { x: 4, y: 3, w: 3, h: 2, kind: 'pond' }, { x: 57, y: 3, w: 3, h: 2, kind: 'pond' },
];

// Tree positions (tiles). Kept off the roads, doors and token spots.
export const TREES = (() => {
  const t = [];
  const add = (x, y) => t.push({ x, y });
  for (let x = 3; x < 61; x += 3) if (x < 27 || x > 36) { if (x < 21 || x > 28) add(x, 39); /* keep the SRMIST sign (x 22-28) clear */ add(x + 1, 41); }
  for (let y = 4; y < 36; y += 4) { add(3, y); add(60, y); }
  [[20, 28], [20, 31], [19, 14], [19, 18], [19, 6], [44, 28], [44, 31], [44, 14], [44, 18], [44, 6],
   [24, 36 - 3], [38, 36 - 3], [26, 12], [37, 12], [29, 12], [34, 12], [24, 4], [40, 4], [22, 15], [42, 15],
   [24, 20], [39, 20], [35, 25], [28, 25]].forEach(([x, y]) => add(x, y));
  return t;
})();

export function treeBlocked(blocked) {
  for (const t of TREES) if (blocked[t.y] && t.y > 1 && t.x > 1) blocked[t.y][t.x] = 1;
  return blocked;
}

export function isBlockedPx(blocked, px, py) {
  const tx = Math.floor(px / MAP.tile), ty = Math.floor(py / MAP.tile);
  if (tx < 0 || ty < 0 || tx >= MAP.cols || ty >= MAP.rows) return true;
  return blocked[ty][tx] === 1;
}

// Foot-box collision: box centred at (x,y) with half-sizes hw,hh
export function boxBlocked(blocked, x, y, hw = 8, hh = 5) {
  return isBlockedPx(blocked, x - hw, y - hh) || isBlockedPx(blocked, x + hw, y - hh) ||
    isBlockedPx(blocked, x - hw, y + hh) || isBlockedPx(blocked, x + hw, y + hh);
}

export function nearestWalkable(blocked, tx, ty) {
  if (!blocked[ty]?.[tx]) return { x: tx, y: ty };
  for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    const x = tx + dx, y = ty + dy;
    if (blocked[y] && blocked[y][x] === 0) return { x, y };
  }
  return { x: tx, y: ty };
}

class MinHeap {
  constructor() { this.a = []; }
  push(n) { const a = this.a; a.push(n); let i = a.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; [a[p], a[i]] = [a[i], a[p]]; i = p; } }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop();
    if (a.length) { a[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < a.length && a[l].f < a[m].f) m = l; if (r < a.length && a[r].f < a[m].f) m = r; if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m; } }
    return top;
  }
  get size() { return this.a.length; }
}

// returns array of {x,y} tile centres from start to goal, or null
export function findPath(blocked, sx, sy, gx, gy) {
  const { cols, rows } = MAP;
  const inB = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows;
  if (!inB(sx, sy) || !inB(gx, gy)) return null;
  if (blocked[gy][gx]) return null;
  const key = (x, y) => y * cols + x;
  const g = new Float32Array(cols * rows).fill(Infinity);
  const came = new Int32Array(cols * rows).fill(-1);
  const closed = new Uint8Array(cols * rows);
  const h = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy); };
  const open = new MinHeap();
  g[key(sx, sy)] = 0; open.push({ x: sx, y: sy, f: h(sx, sy) });
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  while (open.size) {
    const cur = open.pop(); const ck = key(cur.x, cur.y);
    if (closed[ck]) continue; closed[ck] = 1;
    if (cur.x === gx && cur.y === gy) {
      const path = []; let k = ck;
      while (k !== -1) { path.push({ x: k % cols, y: Math.floor(k / cols) }); k = came[k]; }
      return path.reverse();
    }
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!inB(nx, ny) || blocked[ny][nx]) continue;
      if (dx !== 0 && dy !== 0 && (blocked[cur.y][nx] || blocked[ny][cur.x])) continue; // no corner cutting
      const nk = key(nx, ny); if (closed[nk]) continue;
      const ng = g[ck] + (dx !== 0 && dy !== 0 ? Math.SQRT2 : 1);
      if (ng < g[nk]) { g[nk] = ng; came[nk] = ck; open.push({ x: nx, y: ny, f: ng + h(nx, ny) }); }
    }
  }
  return null;
}
