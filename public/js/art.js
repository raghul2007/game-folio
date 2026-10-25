// All artwork is original and generated procedurally with Canvas 2D (no third-party assets).
import { MAP, MISSIONS } from './data.js';
import { FURNITURE } from './nav.js';

export const T = MAP.tile;

export function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export function rr(ctx, x, y, w, h, r, fill, stroke) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
const ell = (ctx, x, y, rx, ry, fill) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };

// ------------------------------------------------------------------ character
export const PALETTES = {
  raghul: { skin: '#c98a52', skinDark: '#a56a38', hair: '#17171f', jacket: '#1f6feb', jacketDark: '#1553b8', shirt: '#f4f7fb', pants: '#27304a', shoe: '#ffffff', bag: '#0e8a7d', bagAcc: '#38e1ff' },
  s1: { skin: '#e0ac7e', skinDark: '#b98457', hair: '#3b2a20', jacket: '#d9534f', jacketDark: '#a73a37', shirt: '#fff', pants: '#3a3f58', shoe: '#eee', bag: '#444', bagAcc: '#ffd166' },
  s2: { skin: '#a8693a', skinDark: '#8a5229', hair: '#0f0f12', jacket: '#7c3aed', jacketDark: '#5b21b6', shirt: '#eee', pants: '#232a3d', shoe: '#ddd', bag: '#e9a23b', bagAcc: '#fff' },
  s3: { skin: '#d49b6a', skinDark: '#b17b4c', hair: '#2a1a12', jacket: '#16a085', jacketDark: '#0e7766', shirt: '#fff', pants: '#4a5568', shoe: '#fff', bag: '#2b6cb0', bagAcc: '#ffd166' },
};

const FW = 48, FH = 64;
export const FRAME = { w: FW, h: FH, footX: 24, footY: 60 };

// frame counts per animation state
export const ANIMS = {
  idle: 2, walk: 4, run: 4, talk: 2, wave: 4, think: 2, happy: 2, celebrate: 4, interact: 2, work: 2, turn: 1,
};

function drawArm(ctx, sx, sy, angle, pal, len = 13) {
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(angle);
  rr(ctx, -2.8, -1, 5.6, len, 2.8, pal.jacket);
  ell(ctx, 0, len - 0.5, 3.1, 3.1, pal.skin);
  ctx.restore();
}

export function drawCharacter(ctx, ox, oy, { dir = 'down', state = 'idle', f = 0, pal = PALETTES.raghul }) {
  const n = ANIMS[state] || 1;
  const p = f / n;
  const s = Math.sin(p * Math.PI * 2);
  const cx = ox + FRAME.footX, fy = oy + FRAME.footY;
  let bob = 0, swing = 0, lean = 0, jump = 0;
  let armL = 0.05, armR = -0.05; // outward angles
  let mouth = 'smile', think = false, sparkle = false, eyesHappy = false;
  switch (state) {
    case 'idle': bob = s * 0.8; armL = 0.08 + s * 0.02; armR = 0.08 - s * 0.02; break;
    case 'walk': swing = s * 5; bob = Math.abs(s) * 1.6; armL = s * 0.55; armR = -s * 0.55; break;
    case 'run': swing = s * 7; bob = Math.abs(s) * 2.6; armL = s * 0.95; armR = -s * 0.95; lean = 1.5; break;
    case 'talk': mouth = f % 2 ? 'open' : 'small'; armR = f % 2 ? 0.7 : 0.3; armL = 0.1; break;
    case 'wave': armR = 2.5 + s * 0.45; armL = 0.08; mouth = 'open'; break;
    case 'think': think = true; armR = 2.1; mouth = 'flat'; break;
    case 'happy': jump = Math.abs(s) * 3; armL = 0.5; armR = 0.5; mouth = 'open'; eyesHappy = true; break;
    case 'celebrate': jump = Math.abs(Math.sin(p * Math.PI)) * 9; armL = 2.7; armR = 2.7; mouth = 'open'; eyesHappy = true; sparkle = true; break;
    case 'interact': armR = 1.5 + s * 0.2; armL = 0.1; break;
    case 'work': armL = 1.3 + s * 0.25; armR = 1.3 - s * 0.25; break;
    default: break;
  }
  const y0 = fy - jump - bob; // feet lift
  ell(ctx, cx, fy + 1, 11 - jump * 0.5, 3.2, 'rgba(0,0,0,.25)');
  const side = dir === 'left' || dir === 'right';
  const sg = dir === 'left' ? -1 : 1; // facing sign for side views

  // backpack (behind body for up/side, strap edges for down)
  if (dir === 'up') {
    rr(ctx, cx - 10, y0 - 40, 20, 24, 5, pal.bag); rr(ctx, cx - 6, y0 - 34, 12, 3, 1.5, pal.bagAcc); rr(ctx, cx - 6, y0 - 28, 12, 3, 1.5, pal.bagAcc);
  } else if (side) {
    rr(ctx, cx - sg * 13, y0 - 39, 9, 22, 4, pal.bag); rr(ctx, cx - sg * 12, y0 - 33, 6, 3, 1.5, pal.bagAcc);
  } else {
    rr(ctx, cx - 13, y0 - 38, 5, 18, 3, pal.bag); rr(ctx, cx + 8, y0 - 38, 5, 18, 3, pal.bag);
  }

  // legs
  const legW = side ? 7 : 7.5;
  const lx = side ? [-3, 3] : [-4.8, 4.8];
  const lsw = side ? [swing * sg, -swing * sg] : [0, 0];
  for (let i = 0; i < 2; i++) {
    const dy = side ? 0 : (i ? -swing : swing) * 0.5;
    const x = cx + lx[i] + lsw[i] - legW / 2;
    rr(ctx, x, y0 - 15 + dy, legW, 13, 2.5, pal.pants);
    rr(ctx, x - 0.5 + (side ? sg * 1.5 : 0), y0 - 4 + dy, legW + 1, 5, 2.5, pal.shoe);
  }

  // torso
  const tw = side ? 15 : 21;
  rr(ctx, cx - tw / 2 + lean * sg, y0 - 36, tw, 22, 5, pal.jacket);
  if (dir === 'down') {
    ctx.beginPath(); ctx.moveTo(cx - 4, y0 - 36); ctx.lineTo(cx + 4, y0 - 36); ctx.lineTo(cx, y0 - 27); ctx.closePath(); ctx.fillStyle = pal.shirt; ctx.fill();
    ctx.fillStyle = pal.jacketDark; ctx.fillRect(cx - 5, y0 - 28, 1.6, 13); ctx.fillRect(cx + 3.4, y0 - 28, 1.6, 13);
  } else if (dir === 'up') {
    ctx.fillStyle = pal.jacketDark; ctx.fillRect(cx - 1, y0 - 36, 2, 22);
  }

  // arms
  const shY = y0 - 33;
  if (side) {
    drawArm(ctx, cx + lean * sg, shY, (armL) * sg * (state === 'walk' || state === 'run' ? 1 : 0.2) * -1, pal);
    if (state === 'wave' || state === 'celebrate' || state === 'think' || state === 'interact') drawArm(ctx, cx + lean * sg, shY, -sg * armR, pal);
  } else {
    drawArm(ctx, cx - tw / 2 + 0.5, shY, armL, pal);      // left of screen: positive angle swings hand toward body-left? (rotate cw => hand to screen-left)
    drawArm(ctx, cx + tw / 2 - 0.5, shY, -armR, pal);
  }

  // head
  const hx = cx + lean * sg * 1.2, hy = y0 - 46;
  ell(ctx, hx, hy, 10.5, 11.2, pal.skin);
  if (side) { ell(ctx, hx - sg * 10, hy + 1, 2.4, 3.4, pal.skin); ell(ctx, hx + sg * 1, hy + 2, 2, 3, pal.skinDark); }
  else { ell(ctx, hx - 10.3, hy + 1, 2.2, 3.2, pal.skin); ell(ctx, hx + 10.3, hy + 1, 2.2, 3.2, pal.skin); }

  // hair (voluminous)
  ctx.fillStyle = pal.hair;
  if (dir === 'up') { ell(ctx, hx, hy - 1, 11.5, 11.8, pal.hair); }
  else {
    ctx.beginPath(); ctx.ellipse(hx, hy - 5.5, 12, 8.2, 0, Math.PI, 0); ctx.fill();
    ell(ctx, hx - 6, hy - 10, 5.5, 4.2, pal.hair); ell(ctx, hx + 3, hy - 12, 6.5, 4.5, pal.hair); ell(ctx, hx + 8, hy - 8, 4.2, 4, pal.hair);
    if (side) ell(ctx, hx - sg * 6, hy - 1, 5.2, 7.5, pal.hair);
  }

  // face
  if (dir === 'down') {
    if (eyesHappy) { ctx.strokeStyle = '#1a1a22'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(hx - 4, hy + 1, 2.4, Math.PI, 0); ctx.moveTo(hx + 6.4, hy + 1); ctx.arc(hx + 4, hy + 1, 2.4, 0, Math.PI, true); ctx.stroke(); }
    else { ell(ctx, hx - 4, hy + 1, 2, 2.6, '#1a1a22'); ell(ctx, hx + 4, hy + 1, 2, 2.6, '#1a1a22'); ell(ctx, hx - 3.4, hy, 0.7, 0.7, '#fff'); ell(ctx, hx + 4.6, hy, 0.7, 0.7, '#fff'); }
    ell(ctx, hx - 7, hy + 5, 2.2, 1.4, 'rgba(230,100,90,.35)'); ell(ctx, hx + 7, hy + 5, 2.2, 1.4, 'rgba(230,100,90,.35)');
    drawMouth(ctx, hx, hy + 6.5, mouth);
  } else if (side) {
    ell(ctx, hx + sg * 4.5, hy + 1, 1.9, 2.5, '#1a1a22'); ell(ctx, hx + sg * 5, hy + 0.3, 0.6, 0.6, '#fff');
    ell(ctx, hx + sg * 9.6, hy + 3.3, 1.5, 1.3, pal.skinDark);
    drawMouth(ctx, hx + sg * 5.5, hy + 6.8, mouth === 'open' ? 'small' : mouth);
  }
  if (think) { ell(ctx, hx + 13, hy - 14, 1.6, 1.6, '#fff'); ell(ctx, hx + 17, hy - 19, 2.4, 2.4, '#fff'); rr(ctx, hx + 15, hy - 31, 16, 11, 5, '#fff'); ctx.fillStyle = '#1f6feb'; ctx.font = 'bold 9px sans-serif'; ctx.fillText('...', hx + 18, hy - 22); }
  if (sparkle) { ctx.fillStyle = '#ffd166'; [[-18, -52, 2.4], [18, -55, 2], [22, -35, 1.6], [-20, -34, 1.8]].forEach(([dx, dy, r], i) => { const q = (Math.sin(p * 6.28 + i) + 1) / 2; ell(ctx, cx + dx, y0 + dy, r * (0.6 + q), r * (0.6 + q), '#ffd166'); }); }
}

function drawMouth(ctx, x, y, kind) {
  ctx.strokeStyle = '#6b2f1f'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  if (kind === 'open') { ell(ctx, x, y + 0.5, 3.2, 2.8, '#7a2b24'); ell(ctx, x, y + 1.8, 1.8, 1, '#e8837a'); }
  else if (kind === 'small') { ell(ctx, x, y + 0.5, 2, 1.6, '#7a2b24'); }
  else if (kind === 'flat') { ctx.beginPath(); ctx.moveTo(x - 2.5, y + 1); ctx.lineTo(x + 2.5, y + 1); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(x, y - 1, 3.3, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
}

// Pre-render a sprite sheet (canvases) for a palette. sheet[state][dir] -> array of canvases.
export function buildSpriteSheet(pal, states = Object.keys(ANIMS)) {
  const sheet = {};
  for (const st of states) {
    sheet[st] = {};
    for (const dir of ['down', 'left', 'right', 'up']) {
      const frames = [];
      for (let f = 0; f < ANIMS[st]; f++) {
        const c = document.createElement('canvas'); c.width = FW; c.height = FH;
        drawCharacter(c.getContext('2d'), 0, 0, { dir, state: st, f, pal });
        frames.push(c);
      }
      sheet[st][dir] = frames;
    }
  }
  return sheet;
}

// ------------------------------------------------------------------ trees / props (dynamic layer)
export function drawTree(ctx, px, py, sway, v) {
  // px,py = base centre of trunk in world px
  ell(ctx, px, py + 2, 16, 6, 'rgba(0,0,0,.22)');
  rr(ctx, px - 4, py - 22, 8, 24, 3, '#6b4a2b');
  const g = ['#2f8f46', '#3aa356', '#2a7d3f'][v % 3];
  ell(ctx, px + sway, py - 34, 18, 16, g); ell(ctx, px - 9 + sway * 0.8, py - 26, 11, 10, '#2a7d3f'); ell(ctx, px + 10 + sway * 1.1, py - 27, 11, 9, '#37a050');
  ell(ctx, px - 4 + sway * 1.2, py - 40, 7, 5, 'rgba(255,255,255,.12)');
  if (v % 4 === 0) { ctx.fillStyle = '#ff9eb5'; [[-8, -34], [6, -38], [10, -28]].forEach(([dx, dy]) => ell(ctx, px + dx + sway, py + dy, 1.8, 1.8, '#ff9eb5')); }
}

// ------------------------------------------------------------------ world bake
export const LAMPS = [[29, 39], [35, 39], [29, 33], [35, 33], [29, 27], [35, 27], [29, 19], [35, 19], [29, 11], [35, 11], [13, 36], [51, 36], [13, 24], [51, 24], [13, 12], [51, 12], [22, 25], [42, 25]];

export function bakeWorld(blocked) {
  const W = MAP.cols * T, H = MAP.rows * T;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const R = rng(7);
  // grass
  ctx.fillStyle = '#5aa957'; ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < MAP.rows; y++) for (let x = 0; x < MAP.cols; x++) {
    if ((x + y) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(x * T, y * T, T, T); }
  }
  for (let i = 0; i < 3200; i++) { ctx.fillStyle = R() > 0.5 ? 'rgba(30,110,50,.35)' : 'rgba(150,220,120,.25)'; ctx.fillRect(R() * W, R() * H, 2, 5 + R() * 3); }

  const path = (x, y, w, h, base = '#c9c2b3') => {
    ctx.fillStyle = base; ctx.fillRect(x * T, y * T, w * T, h * T);
    ctx.strokeStyle = 'rgba(90,80,60,.25)'; ctx.lineWidth = 1;
    for (let i = 0; i <= w; i++) { ctx.beginPath(); ctx.moveTo((x + i) * T, y * T); ctx.lineTo((x + i) * T, (y + h) * T); ctx.stroke(); }
    for (let j = 0; j <= h; j++) { ctx.beginPath(); ctx.moveTo(x * T, (y + j) * T); ctx.lineTo((x + w) * T, (y + j) * T); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.strokeRect(x * T + 1, y * T + 1, w * T - 2, h * T - 2);
  };
  // roads: avenues, main road, door streets
  path(4, 24, 56, 2); path(4, 12, 56, 2);
  const road = (x, y, w, h) => { ctx.fillStyle = '#4b5563'; ctx.fillRect(x * T, y * T, w * T, h * T); ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let j = y * T; j < (y + h) * T; j += 40) ctx.fillRect((x + w / 2) * T - 2, j, 4, 22); ctx.fillStyle = '#e5e7eb'; ctx.fillRect(x * T, y * T, 3, h * T); ctx.fillRect((x + w) * T - 3, y * T, 3, h * T); };
  road(30, 8, 4, 29);
  // door streets
  for (const m of MISSIONS) {
    if (!m.rect) continue;
    const dx = m.door.x, dy = m.door.y;
    if (m.id === 'library' || m.id === 'career') continue;
    const toX = dx < 32 ? 30 : 34;
    const x0 = Math.min(dx, toX), w = Math.abs(toX - dx);
    path(x0, dy, w + (dx < 32 ? 0 : 0), 1, '#d6cfbe');
    path(dx - 1, dy, 2, 1, '#e6dfcc');
  }
  // plaza outside the gate
  path(20, 38, 24, 4, '#e4d9bd');
  ctx.fillStyle = 'rgba(31,111,235,.12)'; ctx.beginPath(); ctx.ellipse(32 * T, 40 * T, 7 * T, 1.6 * T, 0, 0, 6.3); ctx.fill();
  // road continues through the gate
  road(30, 36, 4, 2);

  // compound wall
  const wall = (x, y, w, h) => { ctx.fillStyle = '#b5543a'; ctx.fillRect(x * T, y * T, w * T, h * T); ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i < w * 2; i++) ctx.fillRect(x * T + i * 16, y * T + 8, 1, 48); ctx.fillStyle = '#e8d9c0'; ctx.fillRect(x * T, y * T, w * T, 10); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x * T, (y + h) * T - 4, w * T, 4); };
  wall(2, 36, 26, 2); wall(36, 36, 26, 2);
  // boundary hedges
  ctx.fillStyle = '#1f6b3a'; ctx.fillRect(0, 0, W, 2 * T); ctx.fillRect(0, H - 2 * T, W, 2 * T); ctx.fillRect(0, 0, 2 * T, H); ctx.fillRect(W - 2 * T, 0, 2 * T, H);
  ctx.fillStyle = '#2a8a4c'; for (let i = 0; i < W; i += 14) { ell(ctx, i, 2 * T - 6, 10, 9, '#2a8a4c'); ell(ctx, i, H - 2 * T + 6, 10, 9, '#2a8a4c'); } for (let j = 0; j < H; j += 14) { ell(ctx, 2 * T - 6, j, 9, 10, '#2a8a4c'); ell(ctx, W - 2 * T + 6, j, 9, 10, '#2a8a4c'); }

  // flower beds
  for (let i = 0; i < 90; i++) { const x = (4 + R() * 56) * T, y = (3 + R() * 33) * T; const tx = Math.floor(x / T), ty = Math.floor(y / T); if (blocked[ty] && !blocked[ty][tx]) { ctx.fillStyle = ['#ff6b81', '#ffd166', '#fff', '#c084fc'][i % 4]; ell(ctx, x, y, 2.2, 2.2, ctx.fillStyle); } }

  // fountain
  ell(ctx, 32 * T, 31 * T, 1.4 * T, 1.2 * T, '#9aa5b1'); ell(ctx, 32 * T, 31 * T, 1.15 * T, 0.95 * T, '#4aa8e6'); ell(ctx, 32 * T, 30.8 * T, 8, 6, '#cfd8e0'); rr(ctx, 32 * T - 3, 30.2 * T - 8, 6, 12, 3, '#cfd8e0');

  // furniture
  for (const b of FURNITURE) drawFurniture(ctx, b);

  // buildings + gate
  for (const m of MISSIONS) if (m.rect) drawBuilding(ctx, m);
  drawGate(ctx);

  // lamp posts (bases)
  for (const [lx, ly] of LAMPS) { rr(ctx, lx * T + 14, ly * T - 14, 4, 30, 2, '#2d3748'); ell(ctx, lx * T + 16, ly * T - 16, 5, 5, '#fff3b0'); }
  return cv;
}

function drawFurniture(ctx, b) {
  const x = b.x * T, y = b.y * T, w = b.w * T, h = b.h * T;
  if (b.kind === 'bench') { rr(ctx, x + 2, y + 6, w - 4, 14, 3, '#8b5a2b'); rr(ctx, x + 2, y + 2, w - 4, 6, 2, '#a8723a'); ctx.fillStyle = '#4a3320'; ctx.fillRect(x + 6, y + 20, 4, 8); ctx.fillRect(x + w - 10, y + 20, 4, 8); }
  else if (b.kind === 'table') { rr(ctx, x + 4, y + 4, w - 8, h - 8, 6, '#cbb08a'); rr(ctx, x + 8, y + 8, w - 16, h - 16, 4, '#e2cba5'); }
  else if (b.kind === 'planter') { rr(ctx, x + 2, y + 6, w - 4, h - 10, 6, '#7a5236'); for (let i = 0; i < w / 10; i++) ell(ctx, x + 8 + i * 10, y + 6, 6, 7, ['#ff6b81', '#ffd166', '#c084fc'][i % 3]); }
  else if (b.kind === 'pond') { rr(ctx, x - 2, y - 2, w + 4, h + 4, 14, '#9aa5b1'); rr(ctx, x + 2, y + 2, w - 4, h - 4, 12, '#3b9ad9'); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 12, y + 12, 18, 2); ctx.fillRect(x + 36, y + 24, 22, 2); ell(ctx, x + w - 20, y + h - 18, 7, 4, '#3aa356'); }
}

function drawGate(ctx) {
  // pillars: x 28..29 and 34..35, y 34..37
  const pillar = (x) => {
    const px = x * T, py = 34 * T;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(px + 4, py + 4 * T - 4, 2 * T, 8);
    rr(ctx, px, py + 18, 2 * T, 4 * T - 18, 4, '#f2f4f8'); ctx.fillStyle = '#1f6feb'; ctx.fillRect(px, py + 60, 2 * T, 10); ctx.fillStyle = '#0b3d91'; ctx.fillRect(px, py + 72, 2 * T, 4);
    rr(ctx, px - 4, py + 8, 2 * T + 8, 14, 4, '#dfe6f1');
  };
  pillar(28); pillar(34);
  // arch / banner
  rr(ctx, 28 * T - 4, 33 * T + 6, 8 * T + 8, 26, 8, '#0b3d91');
  ctx.fillStyle = '#ffd166'; ctx.fillRect(28 * T - 4, 33 * T + 30, 8 * T + 8, 3);
  ctx.fillStyle = '#fff'; ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('WELCOME TO SRM KTR', 32 * T, 33 * T + 25);
  ctx.textAlign = 'left';
  // sign board outside the wall
  rr(ctx, 22 * T, 38.4 * T, 6.5 * T, 52, 6, '#0b3d91'); ctx.fillStyle = '#fff'; ctx.font = '600 12px system-ui, sans-serif'; ctx.fillText('SRMIST - Kattankulathur', 22.4 * T, 38.4 * T + 22);
  ctx.fillStyle = '#ffd166'; ctx.font = '500 10px system-ui, sans-serif'; ctx.fillText('illustrated portfolio campus', 22.4 * T, 38.4 * T + 40);
}

export function drawBuilding(ctx, m) {
  const { x, y, w, h } = m.rect; const px = x * T, py = y * T, pw = w * T, ph = h * T;
  const roofH = 66;
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(px + 6, py + ph - 4, pw, 10);
  // facade
  rr(ctx, px, py + roofH - 14, pw, ph - roofH + 14, 4, '#f6f3ea');
  ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let i = 0; i < pw; i += 24) ctx.fillRect(px + i, py + roofH, 2, ph - roofH);
  // accent band
  ctx.fillStyle = m.color; ctx.fillRect(px, py + roofH + 2, pw, 8); ctx.fillStyle = m.accent; ctx.fillRect(px, py + roofH + 10, pw, 3);
  // roof
  ctx.beginPath(); ctx.moveTo(px - 8, py + roofH - 8); ctx.lineTo(px + 14, py + 10); ctx.lineTo(px + pw - 14, py + 10); ctx.lineTo(px + pw + 8, py + roofH - 8); ctx.closePath();
  const g = ctx.createLinearGradient(0, py + 10, 0, py + roofH); g.addColorStop(0, m.color); g.addColorStop(1, shade(m.color, -28)); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(px + 6, py + 16 + i * 9); ctx.lineTo(px + pw - 6, py + 16 + i * 9); ctx.stroke(); }
  roofIcon(ctx, m, px, py, pw);
  // windows
  const cols = Math.floor((pw - 120) / 60) + 2; const winY = py + roofH + 24;
  const door = m.door.x * T;
  for (let i = 0; i < 8; i++) {
    const wx = px + 14 + i * ((pw - 28) / 8);
    if (Math.abs(wx + 14 - door) < 70) continue;
    const gl = ctx.createLinearGradient(wx, winY, wx + 28, winY + 40); gl.addColorStop(0, '#bfe9ff'); gl.addColorStop(1, '#5aa9e6');
    rr(ctx, wx, winY, 28, 40, 4, gl, '#d7e2ee'); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(wx + 3, winY + 3, 6, 34);
  }
  void cols;
  // door
  const dx = door - 20; const dy = py + ph - 52;
  rr(ctx, dx - 6, dy - 8, 52, 60, 6, '#2d3748'); rr(ctx, dx, dy, 40, 52, 4, shade(m.accent, -10));
  const dg = ctx.createLinearGradient(dx, dy, dx + 40, dy + 52); dg.addColorStop(0, 'rgba(255,255,255,.85)'); dg.addColorStop(1, 'rgba(120,220,255,.65)');
  ctx.fillStyle = dg; ctx.fillRect(dx + 4, dy + 4, 15, 46); ctx.fillRect(dx + 21, dy + 4, 15, 46);
  // sign
  rr(ctx, door - 78, py + roofH + 16, 156, 22, 6, '#0b1f3a'); ctx.fillStyle = m.accent; ctx.fillRect(door - 78, py + roofH + 36, 156, 2);
  ctx.fillStyle = '#fff'; ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(shortTitle(m), door, py + roofH + 31); ctx.textAlign = 'left';
}

function shortTitle(m) {
  const map = { academic: 'ACADEMIC BLOCK', proglab: 'PROGRAMMING LAB', ai: 'AI & DATA CENTRE', fullstack: 'FULL-STACK HUB', cloud: 'CLOUD & NETWORKING', achievements: 'ACHIEVEMENTS HALL', library: 'CERTIFICATION LIBRARY', innovation: 'INNOVATION', career: 'CAREER CENTRE' };
  return map[m.id] || m.title.toUpperCase();
}

function roofIcon(ctx, m, px, py, pw) {
  const cx = px + pw / 2; ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  switch (m.id) {
    case 'academic': ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(cx, py + 14); ctx.lineTo(cx + 22, py + 26); ctx.lineTo(cx, py + 38); ctx.lineTo(cx - 22, py + 26); ctx.closePath(); ctx.fill(); ctx.fillRect(cx - 10, py + 36, 20, 8); break;
    case 'proglab': ctx.font = '700 28px monospace'; ctx.textAlign = 'center'; ctx.fillText('</>', cx, py + 44); ctx.textAlign = 'left'; break;
    case 'ai': for (const [dx, dy] of [[-28, 18], [-28, 38], [0, 14], [0, 28], [0, 42], [28, 18], [28, 38]]) { ctx.beginPath(); ctx.arc(cx + dx, py + dy, 4, 0, 6.3); ctx.fill(); } ctx.globalAlpha = 0.6; for (const a of [[-28, 18], [-28, 38]]) for (const b of [[0, 14], [0, 28], [0, 42]]) { ctx.beginPath(); ctx.moveTo(cx + a[0], py + a[1]); ctx.lineTo(cx + b[0], py + b[1]); ctx.stroke(); } for (const a of [[0, 14], [0, 28], [0, 42]]) for (const b of [[28, 18], [28, 38]]) { ctx.beginPath(); ctx.moveTo(cx + a[0], py + a[1]); ctx.lineTo(cx + b[0], py + b[1]); ctx.stroke(); } break;
    case 'fullstack': rr(ctx, cx - 28, py + 16, 56, 32, 4, null, '#fff'); ctx.beginPath(); ctx.moveTo(cx - 28, py + 26); ctx.lineTo(cx + 28, py + 26); ctx.stroke(); ctx.fillRect(cx - 20, py + 32, 24, 3); ctx.fillRect(cx - 20, py + 39, 14, 3); break;
    case 'cloud': ctx.beginPath(); ctx.arc(cx - 14, py + 36, 12, 0, 6.3); ctx.arc(cx + 2, py + 28, 16, 0, 6.3); ctx.arc(cx + 20, py + 36, 11, 0, 6.3); ctx.fill(); ctx.fillRect(cx - 26, py + 36, 56, 11); break;
    case 'achievements': ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(cx - 16, py + 14); ctx.lineTo(cx + 16, py + 14); ctx.lineTo(cx + 10, py + 34); ctx.lineTo(cx - 10, py + 34); ctx.closePath(); ctx.fill(); ctx.fillRect(cx - 3, py + 34, 6, 8); ctx.fillRect(cx - 12, py + 42, 24, 5); break;
    case 'library': for (let i = -3; i <= 3; i++) ctx.fillRect(cx + i * 20 - 4, py + 20, 8, 30); ctx.beginPath(); ctx.moveTo(cx - 74, py + 20); ctx.lineTo(cx, py + 6); ctx.lineTo(cx + 74, py + 20); ctx.closePath(); ctx.fill(); break;
    case 'innovation': ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.lineTo(cx + Math.cos(a) * 20, py + 30 + Math.sin(a) * 20); } ctx.closePath(); ctx.stroke(); ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.5; ctx.lineTo(cx + Math.cos(a) * 10, py + 30 + Math.sin(a) * 10); } ctx.closePath(); ctx.stroke(); break;
    case 'career': ctx.fillRect(cx - 3, py - 4, 6, 40); ctx.beginPath(); ctx.arc(cx, py - 6, 6, 0, 6.3); ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(cx - 40, py + 32, 80, 14); break;
    default: break;
  }
  ctx.restore();
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); const cl = (v) => Math.max(0, Math.min(255, v));
  const r = cl((n >> 16) + amt), g = cl(((n >> 8) & 255) + amt), b = cl((n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

// small helpers shared by game + panels
export function drawCloud(ctx, x, y, s, a = 0.85) {
  ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.beginPath(); ctx.ellipse(x, y, 46 * s, 16 * s, 0, 0, 6.3); ctx.ellipse(x - 26 * s, y + 4 * s, 28 * s, 13 * s, 0, 0, 6.3); ctx.ellipse(x + 26 * s, y + 5 * s, 30 * s, 12 * s, 0, 0, 6.3); ctx.ellipse(x - 6 * s, y - 10 * s, 26 * s, 14 * s, 0, 0, 6.3); ctx.fill();
}
