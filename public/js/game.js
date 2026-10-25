// Canvas game engine: world, player, collision, camera, NPCs, interactions, navigation, cinematic intro.
import { MAP, MISSIONS, TOKENS, NPC_ROUTES } from './data.js';
import { buildGrid, treeBlocked, TREES, boxBlocked, findPath, nearestWalkable } from './nav.js';
import { T, rng, bakeWorld, buildSpriteSheet, PALETTES, drawTree, drawCloud, LAMPS, ANIMS, FRAME, rr } from './art.js';

const WORLD_W = MAP.cols * T, WORLD_H = MAP.rows * T;
const SPAWN = { x: 32 * T, y: 40 * T };
const INTERACT_R = 64;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export function doorPx(m) { return { x: m.door.x * T, y: m.door.y * T + T / 2 }; }

export class Game extends EventTarget {
  constructor(canvas, store, sheet) {
    super();
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.store = store; this.sheet = sheet;
    this.blocked = treeBlocked(buildGrid());
    this.world = bakeWorld(this.blocked);
    this.npcSheets = ['s1', 's2', 's3'].map((k) => buildSpriteSheet(PALETTES[k], ['idle', 'walk']));
    this.mode = 'intro'; // intro | play | paused | panel
    this.keys = new Set(); this.joy = { x: 0, y: 0 }; this.joyRun = false;
    this.player = { x: SPAWN.x, y: SPAWN.y, dir: 'down', moving: false, running: false, t: 0, pose: null, poseUntil: 0, stepT: 0 };
    this.cam = { x: SPAWN.x, y: SPAWN.y, zoom: 1, baseZoom: 1 };
    this.view = { w: 800, h: 600, dpr: 1 };
    this.nav = { target: null, path: [], dash: 0, recalcT: 0, lastTile: '' };
    this.near = null; this.time = 0; this.fade = 0; this.fadeDir = 0; this.fadeCb = null;
    this.introT = 0; this.introPhase = ''; this.reduce = false; this.quality = 'high'; this.fpsAcc = 0; this.fpsN = 0; this.fpsT = 0;
    this.floaters = []; this.sparkles = []; this.talking = false;
    const R = rng(11);
    this.clouds = Array.from({ length: 9 }, () => ({ x: R() * WORLD_W, y: R() * WORLD_H, s: 0.8 + R() * 1.3, v: 6 + R() * 10 }));
    this.birds = Array.from({ length: 7 }, (_, i) => ({ x: R() * WORLD_W, y: 150 + R() * 900, v: 40 + R() * 30, p: R() * 6, s: 0.8 + R() * 0.6, i }));
    this.dust = Array.from({ length: 46 }, () => ({ x: R(), y: R(), v: 0.01 + R() * 0.02, r: 1 + R() * 2, p: R() * 6 }));
    this.npcs = NPC_ROUTES.map((route, i) => ({ x: route[0][0] * T + 16, y: route[0][1] * T + 16, route, wp: 1, dir: 'down', f: 0, sheet: this.npcSheets[i % 3], speed: 38 + (i % 3) * 8 }));
    this.treeVar = TREES.map((_, i) => i);
    this.statusTick = 0;
    this._bind(); this.resize();
    const p = nearestWalkable(this.blocked, Math.floor(SPAWN.x / T), Math.floor(SPAWN.y / T));
    this.player.x = p.x * T + T / 2; this.player.y = p.y * T + T / 2;
  }

  // ---------------------------------------------------------------- setup
  _bind() {
    this._kd = (e) => {
      const tag = (e.target?.tagName || '').toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k) && this.mode === 'play') e.preventDefault();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) this.keys.add(k);
      if ((k === 'e' || k === 'enter') && this.mode === 'play' && !e.repeat) { if (document.activeElement && document.activeElement !== document.body && k === 'enter' && ['BUTTON', 'A'].includes(document.activeElement.tagName)) return; this.interact(); }
    };
    this._ku = (e) => this.keys.delete(e.key.toLowerCase());
    this._blur = () => { this.keys.clear(); this.joy = { x: 0, y: 0 }; };
    window.addEventListener('keydown', this._kd); window.addEventListener('keyup', this._ku); window.addEventListener('blur', this._blur);
    this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(this.canvas.parentElement || this.canvas);
    this.canvas.addEventListener('pointerdown', (e) => this._tap(e));
    document.addEventListener('visibilitychange', () => { if (document.hidden) this._blur(); });
  }
  destroy() { cancelAnimationFrame(this._raf); window.removeEventListener('keydown', this._kd); window.removeEventListener('keyup', this._ku); window.removeEventListener('blur', this._blur); this._ro?.disconnect(); }

  resize() {
    const r = (this.canvas.parentElement || this.canvas).getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, this.quality === 'low' ? 1 : 2);
    const w = Math.max(320, Math.floor(r.width)), h = Math.max(240, Math.floor(r.height));
    this.canvas.width = Math.floor(w * dpr); this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.view = { w, h, dpr };
    this.cam.baseZoom = clamp(Math.min(h / 520, w / 700), 0.7, 1.7);
    if (this.mode !== 'intro') this.cam.zoom = this.cam.baseZoom;
  }

  start() { this.last = performance.now(); const loop = (ts) => { this._raf = requestAnimationFrame(loop); const dt = Math.max(0, Math.min(0.05, (ts - this.last) / 1000)); this.last = ts; this.update(dt); this.render(); }; this._raf = requestAnimationFrame(loop); }
  setMode(m) {
    if (this.mode === m) return;
    this.mode = m; if (m !== 'play') { this.keys.clear(); this.joy = { x: 0, y: 0 }; this.player.moving = false; }
    if (m === 'play' && this.introPhase !== 'done') { this.introPhase = 'done'; this.cam.zoom = this.cam.baseZoom; }
    this.dispatchEvent(new CustomEvent('mode', { detail: m }));
  }
  restartIntro() { this.introT = this.reduce ? 6 : 0; this.introPhase = ''; this.player.x = SPAWN.x; this.player.y = SPAWN.y; this.player.dir = 'down'; this.mode = 'intro'; this.dispatchEvent(new CustomEvent('mode', { detail: 'intro' })); }
  setJoystick(x, y, run = false) { this.joy = { x, y }; this.joyRun = run; }
  setPose(pose, ms = 2000) { this.player.pose = pose; this.player.poseUntil = ms ? this.time + ms / 1000 : Infinity; this.player.t = 0; }
  setReduced(b) { this.reduce = b; }
  setQuality(q) { this.quality = q; this.resize(); }

  // ---------------------------------------------------------------- interaction
  missionNear() {
    let best = null, bd = INTERACT_R;
    for (const m of MISSIONS) { const d = doorPx(m); const dist = Math.hypot(this.player.x - d.x, this.player.y - d.y); if (dist < bd) { bd = dist; best = m; } }
    return best;
  }
  interact() {
    if (this.mode !== 'play') return;
    const m = this.missionNear();
    if (!m) return;
    this.player.pose = 'interact'; this.player.poseUntil = this.time + 0.5;
    if (!this.store.isUnlocked(m.id)) { this.dispatchEvent(new CustomEvent('locked', { detail: m })); return; }
    this.dispatchEvent(new CustomEvent('interact', { detail: m }));
  }
  _tap(e) {
    if (this.mode !== 'play') return;
    const rect = this.canvas.getBoundingClientRect();
    const wx = (e.clientX - rect.left) / this.cam.zoom + this.cam.x - this.view.w / 2 / this.cam.zoom;
    const wy = (e.clientY - rect.top) / this.cam.zoom + this.cam.y - this.view.h / 2 / this.cam.zoom;
    for (const m of MISSIONS) {
      const inRect = m.rect ? (wx >= m.rect.x * T && wx <= (m.rect.x + m.rect.w) * T && wy >= m.rect.y * T && wy <= (m.rect.y + m.rect.h + 1) * T) : (Math.abs(wx - 32 * T) < 4 * T && wy > 33 * T && wy < 37 * T);
      if (!inRect) continue;
      if (this.near && this.near.id === m.id) this.interact(); else this.setNav(m.id);
      return;
    }
  }

  // ---------------------------------------------------------------- navigation guidance (no teleport)
  setNav(id) {
    if (!id) { this.nav = { target: null, path: [], dash: 0, recalcT: 0, lastTile: '' }; this.dispatchEvent(new CustomEvent('nav', { detail: null })); return; }
    this.nav.target = id; this.nav.lastTile = ''; this._recalc(); this.dispatchEvent(new CustomEvent('nav', { detail: id }));
  }
  _recalc() {
    const m = MISSIONS.find((x) => x.id === this.nav.target); if (!m) return;
    const sx = Math.floor(this.player.x / T), sy = Math.floor(this.player.y / T);
    const start = nearestWalkable(this.blocked, sx, sy); const goal = nearestWalkable(this.blocked, m.door.x, m.door.y);
    const p = findPath(this.blocked, start.x, start.y, goal.x, goal.y);
    this.nav.path = p ? p.map((n) => ({ x: n.x * T + T / 2, y: n.y * T + T / 2 })) : [];
    this.nav.lastTile = `${sx},${sy}`;
  }
  fastTravel(id) { // explicit user action only
    const m = MISSIONS.find((x) => x.id === id); if (!m) return;
    this._fade(() => { const d = doorPx(m); const p = nearestWalkable(this.blocked, Math.floor(d.x / T), Math.floor(d.y / T) + 1); this.player.x = p.x * T + T / 2; this.player.y = p.y * T + T / 2; this.player.dir = 'up'; this.cam.x = this.player.x; this.cam.y = this.player.y; this.setNav(null); });
  }
  _fade(cb) { this.fadeDir = 1; this.fadeCb = cb; }
  transition(cb) { this._fade(cb); }

  // ---------------------------------------------------------------- update
  update(dt) {
    this.time += dt; const P = this.player;
    // fps-based quality guard
    this.fpsT += dt; this.fpsN++; if (this.fpsT > 2.5) { const fps = this.fpsN / this.fpsT; if (this.store.settings.quality === 'auto') { if (fps < 34 && this.quality === 'high') this.setQuality('low'); } this.fpsT = 0; this.fpsN = 0; this.fps = fps; }
    // screen fade for transitions
    if (this.fadeDir !== 0) { this.fade += this.fadeDir * dt * 4.5; if (this.fade >= 1) { this.fade = 1; this.fadeDir = -1; const cb = this.fadeCb; this.fadeCb = null; cb?.(); } else if (this.fade <= 0) { this.fade = 0; this.fadeDir = 0; } }
    if (P.pose && this.time > P.poseUntil) P.pose = null;
    // NPCs and ambience always run (unless reduced motion)
    if (!this.reduce) { for (const n of this.npcs) this._npc(n, dt); for (const c of this.clouds) { c.x += c.v * dt; if (c.x > WORLD_W + 120) c.x = -120; } for (const b of this.birds) { b.x += b.v * dt; if (b.x > WORLD_W + 40) { b.x = -40; } } }

    if (this.mode === 'intro') {
      this.introT += dt;
      const t = this.introT; if (this.reduce) this.introT = Math.max(this.introT, 6);
      const total = 5.5; const k = this.reduce ? 1 : ease(clamp(t / total, 0, 1));
      const zFit = Math.max(this.view.w / WORLD_W, this.view.h / WORLD_H) * 1.02;
      this.cam.zoom = zFit + (this.cam.baseZoom * 1.15 - zFit) * k;
      const tx = SPAWN.x, ty = SPAWN.y - 40;
      this.cam.x = WORLD_W / 2 + (tx - WORLD_W / 2) * k; this.cam.y = WORLD_H / 2 + (ty - WORLD_H / 2) * k;
      P.pose = this.talking ? 'talk' : (t > total ? 'wave' : null); P.poseUntil = Infinity; P.t += dt;
      if (t > total && this.introPhase !== 'character') { this.introPhase = 'character'; this.dispatchEvent(new CustomEvent('intro-phase', { detail: 'character' })); }
      if (t <= total && this.introPhase === '') { this.introPhase = 'campus'; this.dispatchEvent(new CustomEvent('intro-phase', { detail: 'campus' })); }
      return;
    }

    if (this.mode === 'play') {
      let ix = 0, iy = 0; const k = this.keys;
      if (k.has('a') || k.has('arrowleft')) ix -= 1; if (k.has('d') || k.has('arrowright')) ix += 1;
      if (k.has('w') || k.has('arrowup')) iy -= 1; if (k.has('s') || k.has('arrowdown')) iy += 1;
      ix += this.joy.x; iy += this.joy.y;
      const len = Math.hypot(ix, iy); if (len > 1) { ix /= len; iy /= len; }
      const running = k.has('shift') || this.joyRun || len > 0.92 && this.joyRun;
      const speed = running ? 205 : 128;
      P.moving = len > 0.08; P.running = running && P.moving;
      if (P.moving) {
        const dx = ix * speed * dt, dy = iy * speed * dt;
        if (!boxBlocked(this.blocked, P.x + dx, P.y, 8, 5)) P.x += dx;
        if (!boxBlocked(this.blocked, P.x, P.y + dy, 8, 5)) P.y += dy;
        P.x = clamp(P.x, 3 * T, WORLD_W - 3 * T); P.y = clamp(P.y, 3 * T, WORLD_H - 2 * T - 6);
        if (Math.abs(ix) > Math.abs(iy) * 0.9) P.dir = ix < 0 ? 'left' : 'right'; else P.dir = iy < 0 ? 'up' : 'down';
        if (P.pose && P.pose !== 'interact') P.pose = null;
        P.stepT += dt; if (P.stepT > (running ? 0.22 : 0.34)) { P.stepT = 0; this.dispatchEvent(new Event('step')); }
      }
      // tokens
      for (const tk of TOKENS) { if (this.store.tokens.has(tk.id)) continue; if (Math.hypot(P.x - (tk.x * T + 16), P.y - (tk.y * T + 16)) < 24) { this.store.collect(tk.id); this.floaters.push({ x: tk.x * T + 16, y: tk.y * T, t: 0, text: '+' + tk.name }); this.dispatchEvent(new CustomEvent('token', { detail: tk })); } }
      // nearest interactable
      const nm = this.missionNear(); if ((nm?.id ?? null) !== (this.near?.id ?? null)) { this.near = nm; this.dispatchEvent(new CustomEvent('near', { detail: nm })); }
      // navigation guidance
      if (this.nav.target) {
        const m = MISSIONS.find((x) => x.id === this.nav.target); const d = doorPx(m);
        if (Math.hypot(P.x - d.x, P.y - d.y) < INTERACT_R * 0.8) { const id = this.nav.target; this.setNav(null); this.dispatchEvent(new CustomEvent('nav-arrived', { detail: id })); }
        else { this.nav.recalcT += dt; const tile = `${Math.floor(P.x / T)},${Math.floor(P.y / T)}`; if (tile !== this.nav.lastTile && this.nav.recalcT > 0.25) { this.nav.recalcT = 0; this._recalc(); } this.nav.dash += dt * 40; }
      }
    } else if (this.near && this.mode !== 'paused') { /* keep */ }

    P.t += dt;
    // camera follow
    const f = 1 - Math.exp(-7 * dt); const tx = P.x, ty = P.y - 24;
    this.cam.x += (tx - this.cam.x) * f; this.cam.y += (ty - this.cam.y) * f; this.cam.zoom += (this.cam.baseZoom - this.cam.zoom) * (1 - Math.exp(-4 * dt));
    for (const fl of this.floaters) fl.t += dt; this.floaters = this.floaters.filter((fl) => fl.t < 1.6);
  }

  _npc(n, dt) {
    const [tx, ty] = n.route[n.wp]; const gx = tx * T + 16, gy = ty * T + 16; const dx = gx - n.x, dy = gy - n.y; const d = Math.hypot(dx, dy);
    if (d < 3) { n.wp = (n.wp + 1) % n.route.length; return; }
    n.x += (dx / d) * n.speed * dt; n.y += (dy / d) * n.speed * dt; n.f += dt * 6;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  }

  // ---------------------------------------------------------------- render
  _playerFrame() {
    const P = this.player; let state = 'idle';
    if (P.pose && ANIMS[P.pose]) state = P.pose; else if (P.moving) state = P.running ? 'run' : 'walk';
    const rate = { idle: 2, walk: 8, run: 12, talk: 7, wave: 7, think: 2, happy: 6, celebrate: 8, interact: 4, work: 6 }[state] || 6;
    const n = ANIMS[state]; const f = (((Math.floor(P.t * rate) % n) + n) % n) || 0;
    const dir = ['talk', 'wave', 'think', 'happy', 'celebrate', 'work'].includes(state) ? 'down' : P.dir;
    return this.sheet[state][dir][f];
  }

  render() {
    const { ctx, view, cam } = this; const { w, h, dpr } = view; const z = cam.zoom;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#15351f'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const camX = clamp(cam.x - w / 2 / z, -40, WORLD_W - w / z + 40), camY = clamp(cam.y - h / 2 / z, -40, WORLD_H - h / z + 40);
    this.drawCam = { x: camX, y: camY };
    ctx.setTransform(dpr * z, 0, 0, dpr * z, -camX * dpr * z, -camY * dpr * z);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.world, 0, 0);
    const low = this.quality === 'low' || this.reduce; const time = this.time;
    const vx0 = camX - 60, vy0 = camY - 120, vx1 = camX + w / z + 60, vy1 = camY + h / z + 80;
    const inView = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1 + 120;

    this._drawGround(ctx, time, low);
    // entities (y-sorted)
    const ents = [];
    TREES.forEach((t, i) => { const px = t.x * T + 16, py = t.y * T + T - 2; if (inView(px, py)) ents.push({ y: py, d: () => drawTree(ctx, px, py, low ? 0 : Math.sin(time * 1.4 + i) * 1.8, i) }); });
    for (const n of this.npcs) if (inView(n.x, n.y)) ents.push({ y: n.y + 12, d: () => { const fr = n.sheet.walk[n.dir][Math.floor(n.f) % 4]; ctx.drawImage(fr, n.x - FRAME.footX, n.y + 12 - FRAME.footY); } });
    const P = this.player; const pf = this._playerFrame();
    ents.push({ y: P.y + 6, d: () => ctx.drawImage(pf, P.x - FRAME.footX, P.y + 6 - FRAME.footY) });
    ents.sort((a, b) => a.y - b.y); for (const e of ents) e.d();

    this._drawFlags(ctx, time, low);
    this._drawBeacons(ctx, time);
    this._drawRoute(ctx, time);
    if (!low) this._drawCloudsBirds(ctx, time);
    this._drawFloaters(ctx);
    if (this.near && this.mode === 'play') this._drawPrompt(ctx, this.near);

    // time of day grading
    const tod = this.store.settings.time;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (tod !== 'day') {
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = tod === 'sunset' ? 'rgb(255,190,150)' : 'rgb(110,120,190)'; ctx.fillRect(0, 0, w, h); ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(dpr * z, 0, 0, dpr * z, -camX * dpr * z, -camY * dpr * z);
      ctx.globalCompositeOperation = 'lighter';
      for (const [lx, ly] of LAMPS) { const px = lx * T + 16, py = ly * T - 16; if (!inView(px, py)) continue; const g = ctx.createRadialGradient(px, py, 2, px, py, tod === 'evening' ? 90 : 60); g.addColorStop(0, 'rgba(255,225,140,.7)'); g.addColorStop(1, 'rgba(255,225,140,0)'); ctx.fillStyle = g; ctx.fillRect(px - 100, py - 100, 200, 200); }
      ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (!low) { ctx.fillStyle = 'rgba(255,255,255,.55)'; for (const d of this.dust) { const x = ((d.x + time * d.v) % 1) * w, y = ((d.y + Math.sin(time * 0.6 + d.p) * 0.02 + time * d.v * 0.4) % 1) * h; ctx.beginPath(); ctx.arc(x, y, d.r, 0, 6.3); ctx.fill(); } }
    // vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(5,20,40,.35)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
    if (this.fade > 0) { ctx.fillStyle = `rgba(6,16,32,${this.fade})`; ctx.fillRect(0, 0, w, h); }
  }

  _drawGround(ctx, time, low) {
    // fountain water jets
    const fx = 32 * T, fy = 30.8 * T;
    ctx.fillStyle = 'rgba(200,235,255,.9)';
    const n = low ? 6 : 14; for (let i = 0; i < n; i++) { const a = (i / n) * 6.28 + time * 0.7; const ph = (time * 1.6 + i * 0.37) % 1; const r = 4 + ph * 22; const yy = fy - 12 - Math.sin(ph * Math.PI) * 26 + ph * 14; ctx.globalAlpha = 1 - ph * 0.6; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * r * 0.6, yy + Math.sin(a) * r * 0.2, 1.8, 0, 6.3); ctx.fill(); }
    ctx.globalAlpha = 1;
    // token coins
    for (const tk of TOKENS) {
      if (this.store.tokens.has(tk.id)) continue; const x = tk.x * T + 16, y = tk.y * T + 16 + Math.sin(time * 2.4 + tk.x) * 3; const sx = Math.abs(Math.cos(time * 2 + tk.y));
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x, tk.y * T + 26, 9, 3, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.strokeStyle = '#b9770e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 4, 9 * (0.35 + sx * 0.65), 9, 0, 0, 6.3); ctx.fill(); ctx.stroke();
      if (sx > 0.45) { ctx.fillStyle = '#7a4b00'; ctx.font = '700 8px system-ui'; ctx.textAlign = 'center'; ctx.fillText(tk.name.slice(0, 2), x, y - 1); ctx.textAlign = 'left'; }
      if (!low) { ctx.fillStyle = 'rgba(255,230,150,.35)'; ctx.beginPath(); ctx.arc(x, y - 4, 14 + Math.sin(time * 3) * 2, 0, 6.3); ctx.fill(); }
    }
  }

  _drawFlags(ctx, time, low) {
    for (const x of [28.9, 34.9]) {
      const px = x * T, py = 33.6 * T; ctx.fillStyle = '#cbd5e0'; ctx.fillRect(px - 1.5, py - 52, 3, 54);
      ctx.beginPath(); ctx.moveTo(px + 1.5, py - 52); const amp = low ? 0 : 3;
      for (let i = 0; i <= 8; i++) ctx.lineTo(px + 1.5 + i * 4.5, py - 52 + Math.sin(time * 5 + i * 0.7) * amp * (i / 8));
      for (let i = 8; i >= 0; i--) ctx.lineTo(px + 1.5 + i * 4.5, py - 36 + Math.sin(time * 5 + i * 0.7) * amp * (i / 8));
      ctx.closePath(); const g = ctx.createLinearGradient(px, 0, px + 36, 0); g.addColorStop(0, '#1f6feb'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#ffd166'); ctx.fillStyle = g; ctx.fill();
    }
  }

  _drawBeacons(ctx, time) {
    for (const m of MISSIONS) {
      const d = doorPx(m); const x = d.x, y = (m.rect ? m.rect.y * T : 33 * T) - 22 + Math.sin(time * 2.4 + m.order) * 4;
      const done = this.store.completed.has(m.id); const locked = !this.store.isUnlocked(m.id); const target = this.nav.target === m.id;
      ctx.save(); ctx.translate(x, y);
      if (target) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 16 + Math.sin(time * 6) * 3, 0, 6.3); ctx.stroke(); }
      ctx.fillStyle = locked ? '#64748b' : done ? '#ffd166' : '#38e1ff'; ctx.strokeStyle = '#0b1f3a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#0b1f3a'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(locked ? '🔒' : done ? '★' : String(m.order), 0, 4.5); ctx.textAlign = 'left'; ctx.restore();
    }
  }

  _drawRoute(ctx, time) {
    const p = this.nav.path; if (!p.length || !this.nav.target) return;
    ctx.save(); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.setLineDash([2, 10]); ctx.lineDashOffset = -this.nav.dash; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(this.player.x, this.player.y); for (const n of p) ctx.lineTo(n.x, n.y); ctx.stroke(); ctx.restore();
  }

  _drawCloudsBirds(ctx, time) {
    ctx.save(); for (const c of this.clouds) { ctx.fillStyle = 'rgba(0,30,60,.07)'; ctx.beginPath(); ctx.ellipse(c.x + 40, c.y + 60, 70 * c.s, 20 * c.s, 0, 0, 6.3); ctx.fill(); drawCloud(ctx, c.x, c.y - 120, c.s, 0.5); }
    ctx.strokeStyle = '#1a202c'; ctx.lineWidth = 1.8; for (const b of this.birds) { const w = Math.sin(time * 9 + b.p) * 5 * b.s; ctx.beginPath(); ctx.moveTo(b.x - 9 * b.s, b.y - w); ctx.quadraticCurveTo(b.x - 4 * b.s, b.y - 4 * b.s, b.x, b.y); ctx.quadraticCurveTo(b.x + 4 * b.s, b.y - 4 * b.s, b.x + 9 * b.s, b.y - w); ctx.stroke(); } ctx.restore();
  }

  _drawFloaters(ctx) {
    for (const fl of this.floaters) { const a = 1 - fl.t / 1.6; ctx.globalAlpha = a; ctx.font = '700 14px system-ui'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#0b1f3a'; ctx.strokeText(fl.text, fl.x, fl.y - fl.t * 40); ctx.fillStyle = '#ffd166'; ctx.fillText(fl.text, fl.x, fl.y - fl.t * 40); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  }

  _drawPrompt(ctx, m) {
    const d = doorPx(m); const locked = !this.store.isUnlocked(m.id);
    const label = locked ? `Locked - finish the other missions first` : `Press E  -  ${m.title}`;
    ctx.font = '700 13px system-ui'; const tw = ctx.measureText(label).width + 28; const x = d.x - tw / 2, y = d.y - 86 + Math.sin(this.time * 4) * 2;
    ctx.fillStyle = 'rgba(8,22,44,.92)'; rr(ctx, x, y, tw, 28, 14, 'rgba(8,22,44,.92)', '#ffd166'); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(label, d.x, y + 18); ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.moveTo(d.x - 6, y + 28); ctx.lineTo(d.x + 6, y + 28); ctx.lineTo(d.x, y + 36); ctx.fill();
  }
}

export { WORLD_W, WORLD_H, SPAWN };
