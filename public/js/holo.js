// Animated holographic stage shown beside each mission: themed backdrop + the talking cartoon character.
import { drawCharacter, PALETTES, shade } from './art.js';

const TAU = Math.PI * 2;

export function startHolo(canvas, mission, opts) {
  // opts: { getSpeaking:()=>bool, getPose:()=>string|null, reduced:()=>bool }
  const ctx = canvas.getContext('2d'); let raf = 0, t0 = performance.now(), stopped = false;
  const fit = () => { const r = canvas.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1); const w = Math.max(160, Math.round(r.width)), h = Math.max(200, Math.round(r.height)); if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; } return { w, h, dpr }; };
  const frame = (now) => {
    if (stopped) return; raf = requestAnimationFrame(frame);
    const reduced = opts.reduced(); const t = reduced ? 1.2 : Math.max(0, (now - t0) / 1000); const { w, h, dpr } = fit();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#071a33'); g.addColorStop(1, shade(mission.color, -60)); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    backdrop(ctx, mission, w, h, t);
    // floor grid
    ctx.save(); ctx.strokeStyle = 'rgba(56,225,255,.22)'; ctx.lineWidth = 1; const fy = h * 0.78;
    for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * 14, fy); ctx.lineTo(w / 2 + i * 60, h); ctx.stroke(); }
    for (let j = 0; j < 6; j++) { const y = fy + Math.pow(j / 5, 1.8) * (h - fy); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.restore();
    // platform
    const cx = w / 2, base = h * 0.86; const sc = Math.min(w / 190, h / 260, 3.2);
    ctx.strokeStyle = mission.accent; ctx.lineWidth = 2; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3); ctx.beginPath(); ctx.ellipse(cx, base + 2, 60 * sc / 1.6, 12 * sc / 1.6, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(cx, base + 2, 80 * sc / 1.6, 17 * sc / 1.6, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
    // character (vector, crisp at any scale)
    const pose = opts.getPose(); const speaking = opts.getSpeaking();
    let state = pose || (speaking ? 'talk' : 'idle'); if (!pose && !speaking && mission.kind === 'fullstack') state = 'work';
    const n = { idle: 2, talk: 2, wave: 4, think: 2, happy: 2, celebrate: 4, work: 2, interact: 2 }[state] || 2;
    const rate = { idle: 2, talk: 7, wave: 6, think: 2, happy: 5, celebrate: 7, work: 6, interact: 4 }[state] || 4;
    const f = reduced ? 0 : Math.floor(t * rate) % n;
    ctx.save(); ctx.translate(cx - 24 * sc, base - 60 * sc); ctx.scale(sc, sc);
    drawCharacter(ctx, 0, 0, { dir: 'down', state, f, pal: PALETTES.raghul }); ctx.restore();
    // scanlines
    ctx.fillStyle = 'rgba(120,220,255,.04)'; for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  };
  raf = requestAnimationFrame(frame);
  return () => { stopped = true; cancelAnimationFrame(raf); };
}

function backdrop(ctx, m, w, h, t) {
  ctx.save();
  const A = m.accent;
  switch (m.kind) {
    case 'about': for (let i = 0; i < 4; i++) { const x = w * (0.18 + i * 0.22), y = h * 0.22 + Math.sin(t * 1.2 + i) * 8; ctx.strokeStyle = A; ctx.globalAlpha = 0.7; ctx.strokeRect(x - 22, y - 14, 44, 28); ctx.fillStyle = A; ctx.fillRect(x - 16, y - 8, 12, 8); ctx.globalAlpha = 0.45; ctx.fillRect(x - 2, y - 8, 18, 3); ctx.fillRect(x - 2, y - 1, 14, 3); } break;
    case 'education': for (let i = 0; i < 5; i++) { const x = w * (0.12 + i * 0.19), y = h * 0.2 + Math.sin(t * 1.4 + i * 1.3) * 10; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t + i) * 0.15); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(-18, -12, 36, 24); ctx.strokeStyle = A; ctx.strokeRect(-18, -12, 36, 24); ctx.fillStyle = A; ctx.fillRect(-12, -6, 24, 2); ctx.fillRect(-12, 0, 16, 2); ctx.restore(); } break;
    case 'skills': ctx.font = '12px monospace'; for (let i = 0; i < 16; i++) { const x = (i / 16) * w + 6; const y = ((t * 40 + i * 53) % (h * 0.7)); ctx.fillStyle = A; ctx.globalAlpha = 0.5 - (y / (h * 0.7)) * 0.4; ctx.fillText(['01', '{}', '<>', '//', 'fn', '=>', '[]', '&&'][i % 8], x, y); } break;
    case 'ai': { const L = [3, 5, 5, 3]; const pts = L.map((c, li) => Array.from({ length: c }, (_, k) => [w * (0.15 + li * 0.23), h * (0.1 + (k + 0.5) * (0.42 / c))])); ctx.strokeStyle = A; for (let li = 0; li < pts.length - 1; li++) for (const a of pts[li]) for (const b of pts[li + 1]) { ctx.globalAlpha = 0.18; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); const p = (t * 0.8 + a[1] * 0.01) % 1; ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, 1.6, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.fillStyle = A; for (const col of pts) for (const p of col) { ctx.beginPath(); ctx.arc(p[0], p[1], 4.5, 0, TAU); ctx.fill(); } break; }
    case 'fullstack': for (let i = 0; i < 3; i++) { const x = w * (0.08 + i * 0.3), y = h * 0.14 + Math.sin(t + i) * 5; ctx.strokeStyle = A; ctx.strokeRect(x, y, w * 0.26, h * 0.2); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x, y, w * 0.26, 8); ctx.fillStyle = A; ctx.globalAlpha = 0.6; for (let k = 0; k < 4; k++) ctx.fillRect(x + 6, y + 16 + k * 9, w * 0.26 * (0.3 + ((k * 37 + i * 11) % 50) / 100), 3); ctx.globalAlpha = 1; } break;
    case 'cloud': for (let i = 0; i < 4; i++) { const x = w * (0.1 + i * 0.22); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x, h * 0.12, w * 0.16, h * 0.4); ctx.strokeStyle = A; ctx.strokeRect(x, h * 0.12, w * 0.16, h * 0.4); for (let k = 0; k < 7; k++) { const on = Math.sin(t * 3 + i * 2 + k) > 0.2; ctx.fillStyle = on ? A : 'rgba(255,255,255,.2)'; ctx.fillRect(x + 6, h * 0.12 + 8 + k * h * 0.052, 8, 4); } } ctx.strokeStyle = A; ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(w * 0.18, h * 0.12); ctx.bezierCurveTo(w * 0.3, 0, w * 0.6, 0, w * 0.82, h * 0.12); ctx.stroke(); break;
    case 'achievements': for (let i = 0; i < 3; i++) { const x = w * (0.2 + i * 0.3), y = h * 0.22 + Math.sin(t * 1.6 + i) * 8; ctx.fillStyle = ['#cd7f32', '#ffd166', '#c0c8d4'][i]; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.arc(x - 4, y - 4, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 6, y - 36, 5, 22); ctx.fillStyle = '#1f6feb'; ctx.fillRect(x + 1, y - 36, 5, 22); } break;
    case 'certs': for (let i = 0; i < 4; i++) { const x = w * (0.15 + i * 0.22), y = h * 0.2 + Math.sin(t * 1.3 + i * 1.7) * 9; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.9 + i) * 0.2); ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(-20, -14, 40, 28); ctx.strokeStyle = A; ctx.strokeRect(-20, -14, 40, 28); ctx.fillStyle = A; ctx.beginPath(); ctx.arc(10, 7, 4, 0, TAU); ctx.fill(); ctx.fillRect(-14, -6, 24, 2); ctx.fillRect(-14, 0, 16, 2); ctx.restore(); } break;
    case 'innovation': tesseract(ctx, w * 0.5, h * 0.26, Math.min(w, h) * 0.17, t, A); break;
    case 'career': { const open = (Math.sin(t * 0.8) + 1) / 2; ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(w * 0.3, h * 0.08, w * 0.4, h * 0.5); ctx.fillStyle = shade('#0b3d91', 20); ctx.fillRect(w * 0.3, h * 0.08, w * 0.2 * (1 - open * 0.8), h * 0.5); ctx.fillRect(w * 0.7 - w * 0.2 * (1 - open * 0.8), h * 0.08, w * 0.2 * (1 - open * 0.8), h * 0.5); ctx.strokeStyle = A; ctx.strokeRect(w * 0.3, h * 0.08, w * 0.4, h * 0.5); ctx.fillStyle = A; ctx.font = '700 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('LIFT  ' + (1 + Math.floor(t) % 10), w / 2, h * 0.06); break; }
    default: break;
  }
  ctx.restore();
}

// Tesseract (4D hypercube) projected to 2D - a nod to "Tesseract Labs".
function tesseract(ctx, cx, cy, s, t, color) {
  const V = []; for (let i = 0; i < 16; i++) V.push([(i & 1 ? 1 : -1), (i & 2 ? 1 : -1), (i & 4 ? 1 : -1), (i & 8 ? 1 : -1)]);
  const rot = (p, a, i, j) => { const c = Math.cos(a), s2 = Math.sin(a); const q = p.slice(); q[i] = p[i] * c - p[j] * s2; q[j] = p[i] * s2 + p[j] * c; return q; };
  const P = V.map((v) => { let p = rot(v, t * 0.7, 0, 3); p = rot(p, t * 0.5, 1, 2); p = rot(p, t * 0.3, 0, 2); const k = 1 / (2.6 - p[3]); const k2 = 1 / (3.2 - p[2] * k); return [cx + p[0] * k * k2 * s * 3.6, cy + p[1] * k * k2 * s * 3.6]; });
  ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.85;
  for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) { ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); } }
  ctx.fillStyle = '#fff'; for (const p of P) { ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
}

// Reusable standalone tesseract for the Innovation content area
export function drawTesseract(canvas, t, color = '#38e1ff') {
  const ctx = canvas.getContext('2d'); const w = canvas.width, h = canvas.height; ctx.clearRect(0, 0, w, h); tesseract(ctx, w / 2, h / 2, Math.min(w, h) * 0.2, t, color);
}
