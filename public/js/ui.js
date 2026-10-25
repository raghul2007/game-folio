// UI layer: HUD, minimap, mission panel + narration controls, journal, directory, settings, intro and views.
import { MISSIONS, PROFILE, TOKENS, INTRO_NARRATION, CONTROLS, MAP } from './data.js';
import { esc, $$, checkResume, resumeButton, linkedinButton, githubButton, emailButton, prefersReduced, resumeKnown } from './util.js';
import { renderQuick } from './quick.js';
import { doorPx, WORLD_W, WORLD_H } from './game.js';

const q = (id) => document.getElementById(id);

export class UI {
  constructor({ game, store, narrator, sound }) {
    this.game = game; this.store = store; this.narrator = narrator; this.sound = sound;
    this.started = false; this.openCount = 0; this.restoreMode = 'play'; this.panelOpen = false; this.view = 'game'; this.holoPose = null; this.quickRendered = false; this.pendingComplete = false;
    this.dialogs = ['panel', 'journal', 'directory', 'settings', 'help', 'pause', 'complete'].map(q);
  }

  // ------------------------------------------------------------------ init
  init() {
    const { game, store, narrator } = this;
    this._dialogs(); this._intro(); this._hud(); this._settings(); this._narration(); this._touch(); this._keys(); this._minimap();
    game.addEventListener('interact', (e) => this.openMission(e.detail));
    game.addEventListener('locked', () => { const left = MISSIONS.filter((m) => m.required && m.id !== 'career' && !store.completed.has(m.id)).map((m) => m.title); this.toast(`The Career Centre opens after the other required missions. Still to do: ${left.join(', ')}.`, 'warn', 6000); this.sound.error(); });
    game.addEventListener('near', (e) => this._near(e.detail));
    game.addEventListener('token', (e) => { this.sound.token(); this.toast(`Collected token: ${e.detail.name}`, 'gold'); this._refreshHud(); });
    game.addEventListener('step', () => this.sound.step());
    game.addEventListener('nav', () => this._refreshHud());
    game.addEventListener('nav-arrived', (e) => { const m = MISSIONS.find((x) => x.id === e.detail); this.toast(`You have arrived at ${m.title}. Press E to enter.`, 'gold'); this.live(`Arrived at ${m.title}`); });
    store.addEventListener('change', () => { this._refreshHud(); this._renderJournal(); this._renderDir(); });
    this.applySettings(); this._refreshHud();
    window.addEventListener('hashchange', () => this._hash());
    this._hash(true);
  }
  live(msg) { const l = q('live'); l.textContent = ''; setTimeout(() => { l.textContent = msg; }, 30); }
  toast(msg, kind = '', ms = 3800) {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.textContent = msg; q('toasts').appendChild(t); this.live(msg);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
  }

  // ------------------------------------------------------------------ dialogs / modal mode handling
  _dialogs() {
    for (const d of this.dialogs) {
      d.addEventListener('close', () => { this.openCount = Math.max(0, this.openCount - 1); if (d.id === 'panel') this._afterPanel(); if (this.openCount === 0 && this.view === 'game') this.game.setMode(this.started ? 'play' : 'intro'); });
      d.addEventListener('click', (e) => { if (e.target === d && d.id !== 'panel') d.close(); });
    }
    const closers = { 'journal-close': 'journal', 'dir-close': 'directory', 'settings-close': 'settings', 'help-close': 'help', 'pause-resume': 'pause', 'complete-close': 'complete' };
    for (const [b, d] of Object.entries(closers)) q(b).addEventListener('click', () => { this.sound.click(); q(d).close(); });
    q('panel-close').addEventListener('click', () => { this.sound.close(); q('panel').close(); });
    q('pause-journal').addEventListener('click', () => { q('pause').close(); this.open('journal'); });
    q('pause-settings').addEventListener('click', () => { q('pause').close(); this.open('settings'); });
    q('pause-help').addEventListener('click', () => { q('pause').close(); this.open('help'); });
    q('pause-quick').addEventListener('click', () => { q('pause').close(); this.setView('quick'); });
    q('pause-restart').addEventListener('click', () => { q('pause').close(); this.replayTour(); });
  }
  open(id) {
    const d = q(id); if (d.open) return; this.sound.unlock(); this.sound.click();
    if (this.openCount === 0 && this.game.mode !== 'panel') this.restoreMode = this.game.mode;
    if (id === 'journal') this._renderJournal(); if (id === 'directory') this._renderDir(); if (id === 'settings') this._syncSettings(); if (id === 'help') this._renderHelp();
    this.openCount++; this.game.setMode('panel'); d.showModal();
  }

  // ------------------------------------------------------------------ views
  _hash(first) {
    const quick = location.hash === '#quick' || new URLSearchParams(location.search).get('mode') === 'quick';
    if (quick) this.setView('quick'); else if (!first && this.view === 'quick' && location.hash !== '#quick') this.setView('game', true);
  }
  setView(v, fromHash = false) {
    if (v === this.view && (v !== 'quick' || this.quickRendered)) return;
    this.view = v; document.body.dataset.view = v; this.narrator.stop();
    if (v === 'quick') {
      if (!this.quickRendered) { renderQuick(q('quick'), { onExplore: () => this.setView('game') }); this.quickRendered = true; }
      q('app').hidden = true; q('quick').hidden = false; this.game.setMode('paused'); window.scrollTo(0, 0); q('quick').querySelector('h1')?.focus?.();
      if (!fromHash) history.replaceState(null, '', '#quick'); document.title = 'Raghul S - Quick Portfolio';
    } else {
      q('quick').hidden = true; q('app').hidden = false; this.game.setMode(this.started ? 'play' : 'intro'); this.game.resize();
      if (!fromHash) history.replaceState(null, '', location.pathname + location.search.replace(/[?&]mode=quick/, '')); document.title = 'RAGHULVERSE - Explore My World';
    }
  }
  replayTour() {
    this.narrator.stop(); this.started = false; this.store.seenIntro = false; this.game.setNav(null);
    for (const id of ['panel', 'journal', 'directory', 'settings', 'help', 'pause', 'complete']) if (q(id).open) q(id).close();
    q('hud').hidden = true; q('minimap-wrap').hidden = true; q('intro').hidden = false; q('intro-menu').hidden = true; q('intro-caption-box').hidden = true; q('intro-title-box').hidden = false;
    this.game.restartIntro(); this._setHeard(false);
  }

  // ------------------------------------------------------------------ intro / start screen
  _intro() {
    const { game } = this; const unlock = () => { this.sound.unlock(); };
    document.addEventListener('pointerdown', unlock, { once: true }); document.addEventListener('keydown', unlock, { once: true });
    game.addEventListener('intro-phase', (e) => { if (e.detail === 'character' && !this.started) { q('intro-title-box').hidden = true; q('intro-menu').hidden = false; q('intro-caption-box').hidden = false; q('btn-skipintro').hidden = true; q('btn-start').focus({ preventScroll: true }); } });
    q('btn-skipintro').addEventListener('click', () => { game.introT = Math.max(game.introT, 6); this.sound.unlock(); });
    q('btn-hear').addEventListener('click', () => { this.sound.unlock(); this.sound.click(); this.narrator.load(INTRO_NARRATION); this.narrator.play(0); this._setHeard(true); });
    q('btn-start').addEventListener('click', () => this.start());
    q('btn-quick').addEventListener('click', () => this.setView('quick'));
    q('btn-how').addEventListener('click', () => this.open('help'));
    q('btn-sound').addEventListener('click', () => this.open('settings'));
    q('btn-quick2').addEventListener('click', () => this.setView('quick'));
    if (this.game.reduce) q('btn-skipintro').hidden = true;
    checkResume().then(() => { q('link-resume-wrap').innerHTML = resumeKnown() ? `<a class="btn" href="${esc(PROFILE.resumeUrl)}" target="_blank" rel="noopener noreferrer">View Resume</a>` : `<button class="btn" disabled aria-disabled="true" title="The resume PDF has not been added to this deployment yet">View Resume (not added yet)</button>`; });
  }
  _setHeard(on) { q('btn-hear').hidden = on; q('intro-captions').textContent = on ? '' : 'Press “Hear introduction” for voice and captions.'; }
  start() {
    this.sound.unlock(); this.sound.open(); this.narrator.stop(); this.started = true; this.store.seenIntro = true; this.store.save();
    q('intro').hidden = true; q('hud').hidden = false; q('minimap-wrap').hidden = false; this.game.talking = false; this.game.setPose(null, 0);
    this.game.setMode('play'); this.game.canvas.focus(); this._refreshHud();
    const next = MISSIONS.find((m) => !this.store.completed.has(m.id));
    if (next && !this.game.nav.target) this.game.setNav(next.id);
    this.toast('Move with WASD or arrow keys. Walk to a glowing door and press E. Follow the gold dotted guide.', '', 7000);
  }

  // ------------------------------------------------------------------ HUD
  _hud() {
    q('btn-map').addEventListener('click', () => this.toggleMap());
    q('btn-journal').addEventListener('click', () => this.open('journal'));
    q('btn-dir').addEventListener('click', () => this.open('directory'));
    q('btn-settings').addEventListener('click', () => this.open('settings'));
    q('btn-help').addEventListener('click', () => this.open('help'));
    q('btn-pause').addEventListener('click', () => this.open('pause'));
    q('btn-sound-toggle').addEventListener('click', () => { this.store.set('muted', !this.store.settings.muted); this.applySettings(); this.sound.click(); });
    q('prompt').addEventListener('click', () => this.game.interact());
    q('dir-clear').addEventListener('click', () => { this.game.setNav(null); this._renderDir(); });
    checkResume().then(() => { q('hud-resume').innerHTML = resumeKnown() ? `<a class="hud-btn" href="${esc(PROFILE.resumeUrl)}" download aria-label="Download resume PDF" title="Download resume">⬇ Resume</a>` : ''; });
    q('hud-name').textContent = PROFILE.name;
  }
  toggleMap() { const w = q('minimap-wrap'); w.hidden = !w.hidden; q('btn-map').setAttribute('aria-pressed', String(!w.hidden)); }
  objective() { return MISSIONS.find((m) => m.required && !this.store.completed.has(m.id) && this.store.isUnlocked(m.id)) || null; }
  _refreshHud() {
    const s = this.store; const done = s.completed.size;
    q('hud-progress-bar').style.width = `${s.percent}%`; q('hud-progress-text').textContent = `${done}/${MISSIONS.length} missions · ${s.explorePercent}% explored`;
    q('hud-tokens').textContent = `${s.tokens.size}/${s.tokenTotal}`;
    const o = this.objective(); const nav = this.game.nav.target && MISSIONS.find((m) => m.id === this.game.nav.target);
    q('hud-objective').textContent = nav ? `Guide: ${nav.title}` : o ? `Objective: ${o.title}` : s.allDone ? 'All missions complete!' : 'Explore freely';
    const muted = s.settings.muted; const b = q('btn-sound-toggle'); b.textContent = muted ? '🔇' : '🔊'; b.setAttribute('aria-pressed', String(!muted)); b.setAttribute('aria-label', muted ? 'Unmute all sound' : 'Mute all sound');
  }
  _near(m) {
    const p = q('prompt'); if (!m || this.game.mode !== 'play') { p.hidden = true; q('btn-interact').classList.remove('hot'); return; }
    const locked = !this.store.isUnlocked(m.id); p.hidden = false; p.textContent = locked ? `${m.title} is locked` : `Press E: enter ${m.title}`; q('btn-interact').classList.toggle('hot', !locked);
    this.live(locked ? `${m.title}, locked. Complete the other required missions first.` : `Near ${m.title}. Press E to enter.`);
  }

  // ------------------------------------------------------------------ minimap
  _minimap() {
    const cv = q('minimap'); const ctx = cv.getContext('2d'); const W = cv.width, H = cv.height; this.mm = { cv, ctx, W, H };
    const pre = document.createElement('canvas'); pre.width = W; pre.height = H; pre.getContext('2d').drawImage(this.game.world, 0, 0, W, H); this.mm.bg = pre;
    cv.addEventListener('click', (e) => { const r = cv.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H; let best = null, bd = 16; for (const m of MISSIONS) { const d = doorPx(m); const dx = (d.x / WORLD_W) * W, dy = (d.y / WORLD_H) * H; const dist = Math.hypot(dx - x, dy - y); if (dist < bd) { bd = dist; best = m; } } if (best) { this.game.setNav(best.id); this.sound.click(); this.toast(`Guidance set: ${best.title}`); } });
    const tick = () => { requestAnimationFrame(tick); if (q('minimap-wrap').hidden || document.hidden || this.view !== 'game') return; const now = performance.now(); if (now - (this._mmT || 0) < 66) return; this._mmT = now; this._drawMinimap(now / 1000); };
    requestAnimationFrame(tick);
  }
  _drawMinimap(t) {
    const { ctx, W, H, bg } = this.mm; const g = this.game; const sx = W / WORLD_W, sy = H / WORLD_H;
    ctx.clearRect(0, 0, W, H); ctx.drawImage(bg, 0, 0);
    ctx.fillStyle = 'rgba(8,24,48,.25)'; ctx.fillRect(0, 0, W, H);
    // route
    if (g.nav.path.length) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(g.player.x * sx, g.player.y * sy); for (const n of g.nav.path) ctx.lineTo(n.x * sx, n.y * sy); ctx.stroke(); ctx.setLineDash([]); }
    const obj = this.objective();
    for (const m of MISSIONS) {
      const d = doorPx(m); const x = d.x * sx, y = (m.rect ? m.rect.y * 32 + m.rect.h * 16 : d.y - 40) * sy; const done = this.store.completed.has(m.id); const locked = !this.store.isUnlocked(m.id);
      ctx.fillStyle = locked ? '#64748b' : done ? '#ffd166' : '#38e1ff'; ctx.strokeStyle = '#06203a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 6.3); ctx.fill(); ctx.stroke();
      if (obj && obj.id === m.id) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, 7 + Math.sin(t * 5) * 1.5, 0, 6.3); ctx.stroke(); }
    }
    const px = g.player.x * sx, py = g.player.y * sy; ctx.fillStyle = '#ff4d6d'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 6.3); ctx.fill(); ctx.stroke();
    const cx = g.drawCam; if (cx) { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.strokeRect(cx.x * sx, cx.y * sy, (g.view.w / g.cam.zoom) * sx, (g.view.h / g.cam.zoom) * sy); }
  }

  // ------------------------------------------------------------------ mission panel
  async openMission(m) {
    if (this.panelOpen) return; this.panelOpen = true; this.sound.unlock(); this.sound.open(); this.store.visit(m.id); this._near(null);
    const [{ renderMission }, { startHolo }] = await Promise.all([import('./panels.js'), import('./holo.js')]);
    this.game.transition(() => {
      this.mission = m; q('panel').style.setProperty('--mc', m.color); q('panel').style.setProperty('--ma', m.accent);
      q('panel-eyebrow').textContent = `Mission ${m.order} · ${m.place}`; q('panel-title').textContent = m.title; q('panel-summary').textContent = m.summary;
      const root = q('panel-content'); root.innerHTML = ''; root.scrollTop = 0;
      const env = { store: this.store, sound: this.sound, checkResume, actions: { replay: () => { q('panel').close(); this.replayTour(); }, quick: () => { q('panel').close(); this.setView('quick'); }, close: () => q('panel').close() } };
      this.cleanup = renderMission(m, root, env);
      this.holoPose = 'wave'; setTimeout(() => { if (this.holoPose === 'wave') this.holoPose = null; }, 2200);
      this.stopHolo = startHolo(q('holo'), m, { getSpeaking: () => this.narrator.state === 'playing' && !this.store.settings.textOnly, getPose: () => this.holoPose, reduced: () => this._reduced() });
      this._updateClaim(); this._openPanelDialog(); this.narrator.load(m.narration); this.narrator.play(0);
    });
  }
  _openPanelDialog() { if (this.openCount === 0 && this.game.mode !== 'panel') this.restoreMode = this.game.mode; this.openCount++; this.game.setMode('panel'); q('panel').showModal(); q('panel-close').focus(); }
  _afterPanel() {
    this.narrator.stop(); this.cleanup?.(); this.stopHolo?.(); this.cleanup = this.stopHolo = null; this.panelOpen = false; q('panel-content').innerHTML = '';
    this.game.transition(() => {});
    if (this.pendingComplete) { this.pendingComplete = false; setTimeout(() => this.showComplete(), 350); }
  }
  _updateClaim() {
    const m = this.mission; const done = this.store.completed.has(m.id); const b = q('btn-claim');
    b.disabled = done; b.textContent = done ? `Badge earned: ${m.badge} ✓` : `Claim badge: ${m.badge}`; b.setAttribute('aria-disabled', String(done));
  }
  complete(m) {
    if (!this.store.complete(m.id)) return;
    this.store.collect('m-' + m.id); this.sound.badge(); this.toast(`Badge unlocked: ${m.badge} (+ ${m.token} token)`, 'gold', 5200);
    this.holoPose = 'celebrate'; setTimeout(() => { if (this.holoPose === 'celebrate') this.holoPose = null; }, 2600); this._confetti();
    this.game.setPose('celebrate', 2600);
    if (this.mission?.id === m.id) this._updateClaim();
    if (this.store.allDone && m.id === 'career') this.pendingComplete = true;
    const next = this.objective(); if (next && !this.game.nav.target) this.game.setNav(next.id);
  }
  _confetti() {
    if (this._reduced()) return; const box = q('confetti'); box.innerHTML = '';
    for (let i = 0; i < 46; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = ['#ffd166', '#38e1ff', '#ff6b81', '#7aa2ff', '#7dffb2'][i % 5]; s.style.animationDelay = Math.random() * 0.5 + 's'; s.style.animationDuration = 1.6 + Math.random() * 1.4 + 's'; s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); box.appendChild(s); }
    setTimeout(() => { box.innerHTML = ''; }, 3600);
  }
  showComplete() {
    const s = this.store; const body = q('complete-body');
    body.innerHTML = `<p class="lead">You explored Raghul's campus: met his cartoon character, learned about his technical skills, visited his AI and cloud labs, discovered his achievements and certifications, and listened to his story.</p>
      <div class="stats"><div><b>${s.completed.size}/${MISSIONS.length}</b><span>missions</span></div><div><b>${s.tokens.size}/${s.tokenTotal}</b><span>tokens</span></div><div><b>${s.explorePercent}%</b><span>explored</span></div></div>
      <div class="chips">${MISSIONS.filter((m) => s.completed.has(m.id)).map((m) => `<span class="chip on">★ ${esc(m.badge)}</span>`).join('')}</div>
      <div class="row gap wrap" id="complete-actions">${resumeButton()} ${githubButton()} ${linkedinButton()} ${emailButton()}</div>
      <div class="row gap wrap"><button class="btn" id="c-replay">Replay the tour</button><button class="btn" id="c-quick">Quick Portfolio</button></div>`;
    q('c-replay').onclick = () => { q('complete').close(); this.replayTour(); }; q('c-quick').onclick = () => { q('complete').close(); this.setView('quick'); };
    this.open('complete'); this.sound.badge(); this._confetti();
  }

  // ------------------------------------------------------------------ narration controls
  _narration() {
    const n = this.narrator; const st = this.store;
    const cap = () => (this.panelOpen ? q('caption') : q('intro-captions'));
    n.addEventListener('change', (e) => {
      const { text, state, index, total } = e.detail; const el = cap();
      if (st.settings.captions || st.settings.textOnly) el.textContent = state === 'idle' ? '' : text; else el.textContent = '';
      const playing = state === 'playing'; q('nav-play').textContent = playing ? '❚❚' : '▶'; q('nav-play').setAttribute('aria-label', playing ? 'Pause narration' : 'Play narration');
      q('caption-count').textContent = state === 'idle' ? '' : `${Math.max(1, index + 1)}/${total}`;
      this.game.talking = playing && !this.panelOpen && !this.started;
    });
    n.addEventListener('end', () => { if (this.panelOpen && this.mission) { this.complete(this.mission); } this.game.talking = false; });
    n.addEventListener('audiofail', () => { if (!this._warned) { this._warned = true; this.toast('Voice audio is unavailable, so narration is shown as captions.', 'warn', 5000); } });
    n.addEventListener('voices', () => this._fillVoices());
    q('nav-play').addEventListener('click', () => { this.sound.unlock(); n.toggle(); });
    q('nav-prev').addEventListener('click', () => { this.sound.unlock(); n.prev(); }); q('nav-next').addEventListener('click', () => { this.sound.unlock(); n.next(); });
    q('nav-replay').addEventListener('click', () => { this.sound.unlock(); n.replay(); }); q('nav-skip').addEventListener('click', () => n.skip());
    q('nav-mute').addEventListener('click', () => { st.set('muted', !st.settings.muted); this.applySettings(); });
    q('nav-text').addEventListener('click', () => { st.set('textOnly', !st.settings.textOnly); this.applySettings(); });
    q('nav-speed').addEventListener('change', (e) => { st.set('rate', +e.target.value); this.applySettings(); });
    q('nav-voice').addEventListener('change', (e) => { st.set('voiceURI', e.target.value); this.applySettings(); });
    q('btn-claim').addEventListener('click', () => this.mission && this.complete(this.mission));
    this._fillVoices();
  }
  _fillVoices() {
    const vs = this.narrator.voices.filter((v) => /^en/i.test(v.lang)); const list = vs.length ? vs : this.narrator.voices;
    const html = list.length ? `<option value="">Auto voice</option>` + list.map((v) => `<option value="${esc(v.voiceURI)}">${esc(v.name)} (${esc(v.lang)})</option>`).join('') : `<option value="">No browser voice - captions only</option>`;
    for (const id of ['nav-voice', 'set-voice']) { const el = q(id); el.innerHTML = html; el.value = this.store.settings.voiceURI || ''; el.disabled = !list.length; }
  }

  // ------------------------------------------------------------------ settings
  _reduced() { const v = this.store.settings.reduceMotion; return v === null ? prefersReduced() : !!v; }
  _settings() {
    const s = this.store; const bind = (id, key, conv = (e) => e.target.checked, ev = 'change') => q(id).addEventListener(ev, (e) => { s.set(key, conv(e)); this.applySettings(); });
    bind('set-mute', 'muted'); bind('set-music', 'music'); bind('set-sfx', 'sfx'); bind('set-text', 'textOnly'); bind('set-captions', 'captions');
    bind('set-voice', 'voiceURI', (e) => e.target.value); bind('set-rate', 'rate', (e) => +e.target.value); bind('set-time', 'time', (e) => e.target.value);
    bind('set-motion', 'reduceMotion', (e) => (e.target.value === 'auto' ? null : e.target.value === 'on')); bind('set-quality', 'quality', (e) => e.target.value);
    q('set-reset').addEventListener('click', (e) => { const b = e.currentTarget; if (b.dataset.armed !== '1') { b.dataset.armed = '1'; b.textContent = 'Click again to confirm reset'; setTimeout(() => { b.dataset.armed = ''; b.textContent = 'Reset progress'; }, 4000); return; } b.dataset.armed = ''; b.textContent = 'Reset progress'; s.reset(); this.game.setNav(null); this.toast('Progress reset.'); });
    q('j-reset').addEventListener('click', () => q('set-reset').click());
  }
  _syncSettings() {
    const s = this.store.settings; q('set-mute').checked = s.muted; q('set-music').checked = s.music; q('set-sfx').checked = s.sfx; q('set-text').checked = s.textOnly; q('set-captions').checked = s.captions;
    q('set-rate').value = String(s.rate); q('set-time').value = s.time; q('set-motion').value = s.reduceMotion === null ? 'auto' : s.reduceMotion ? 'on' : 'off'; q('set-quality').value = s.quality; q('set-voice').value = s.voiceURI || '';
  }
  applySettings() {
    const s = this.store.settings; this.narrator.settings = s; this.sound.settings = s; this.sound.setMuted(s.muted); this.sound.setMusic(!!s.music && !s.muted);
    const red = this._reduced(); document.documentElement.dataset.reduce = red ? '1' : '0'; this.game.setReduced(red);
    if (s.quality === 'low') this.game.setQuality('low'); else if (s.quality === 'high') this.game.setQuality('high');
    q('nav-mute').textContent = s.muted ? '🔇' : '🔊'; q('nav-mute').setAttribute('aria-pressed', String(s.muted)); q('nav-text').setAttribute('aria-pressed', String(s.textOnly)); q('nav-speed').value = String(s.rate); q('nav-voice').value = s.voiceURI || '';
    this.narrator.applySettings(); this._refreshHud();
  }

  // ------------------------------------------------------------------ journal / directory / help
  _renderJournal() {
    const s = this.store; if (!q('journal-body')) return;
    q('journal-body').innerHTML = `<div class="stats"><div><b>${s.completed.size}/${MISSIONS.length}</b><span>missions</span></div><div><b>${s.tokens.size}/${s.tokenTotal}</b><span>tokens</span></div><div><b>${s.explorePercent}%</b><span>campus explored</span></div></div>
      <ol class="mlist">${MISSIONS.map((m) => { const done = s.completed.has(m.id), locked = !s.isUnlocked(m.id); return `<li class="${done ? 'done' : locked ? 'locked' : ''}"><span class="mnum">${done ? '★' : locked ? '🔒' : m.order}</span><div><strong>${esc(m.title)}</strong><small>${esc(m.subtitle)}${m.required ? '' : ' · optional'} · badge: ${esc(m.badge)}</small></div><em>${done ? 'Completed' : locked ? 'Locked' : s.visited.has(m.id) ? 'Visited' : 'New'}</em></li>`; }).join('')}</ol>
      <h3>Technology tokens</h3><div class="chips">${TOKENS.map((t) => `<span class="chip ${s.tokens.has(t.id) ? 'on' : 'dim'}">${s.tokens.has(t.id) ? esc(t.name) : '???'}</span>`).join('')}${MISSIONS.map((m) => `<span class="chip ${s.tokens.has('m-' + m.id) ? 'on' : 'dim'}">${s.tokens.has('m-' + m.id) ? esc(m.token) : '???'}</span>`).join('')}</div>
      ${s.allDone ? '<p><button class="btn primary" id="j-complete">View completion screen</button></p>' : ''}`;
    q('j-complete')?.addEventListener('click', () => { q('journal').close(); this.showComplete(); });
  }
  _renderDir() {
    const s = this.store; const body = q('dir-body'); if (!body) return; const tgt = this.game.nav.target;
    body.innerHTML = `<p class="note">Guide shows a dotted route; you still walk there. “Open now” is a text alternative that skips walking.</p><ul class="dir">${MISSIONS.map((m) => { const done = s.completed.has(m.id), locked = !s.isUnlocked(m.id); return `<li class="${tgt === m.id ? 'target' : ''}"><div><strong>${m.order}. ${esc(m.title)}</strong><small>${esc(m.place)} · ${locked ? 'locked' : done ? 'completed' : 'available'}</small></div><div class="row gap"><button class="btn sm" data-guide="${m.id}">Guide me</button><button class="btn sm" data-travel="${m.id}" ${locked ? 'disabled' : ''}>Fast travel</button><button class="btn sm" data-open="${m.id}" ${locked ? 'disabled' : ''}>Open now</button></div></li>`; }).join('')}</ul>`;
  }
  _renderHelp() {
    q('help-body').innerHTML = `<table class="keys"><tbody>${CONTROLS.map(([k, d]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(d)}</td></tr>`).join('')}</tbody></table>
      <h3>Touch</h3><p>Use the joystick on the left to move, the Run button to sprint, and the Enter button on the right near a glowing door. You can also tap a building to be guided there.</p>
      <h3>Goal</h3><p>Visit the buildings, listen to or read each story, and claim badges. Collect the gold tech coins on the paths. The Career Centre opens after the other required missions.</p>
      <p class="note">Prefer not to play? Use <b>Quick Portfolio</b> for a conventional page.</p>`;
  }

  // ------------------------------------------------------------------ keyboard + touch
  _keys() {
    window.addEventListener('keydown', (e) => {
      const tag = (e.target?.tagName || '').toUpperCase(); const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || e.target?.isContentEditable; const k = e.key.toLowerCase();
      if (typing || e.ctrlKey || e.metaKey || e.altKey || this.view !== 'game') return;
      if (k === ' ' && this.panelOpen && !['BUTTON', 'A'].includes(tag)) { e.preventDefault(); this.sound.unlock(); this.narrator.toggle(); return; }
      if (k === ' ' && !this.started && !['BUTTON', 'A'].includes(tag)) { e.preventDefault(); }
      if (!this.started) return;
      if (k === 'm' && this.openCount === 0) this.toggleMap();
      else if (k === 'j') { if (q('journal').open) q('journal').close(); else if (this.openCount === 0) this.open('journal'); }
      else if (k === 'escape' && this.openCount === 0 && this.game.mode === 'play') { e.preventDefault(); this.open('pause'); }
    });
    q('dir-body').addEventListener('click', (e) => {
      const g = e.target.closest('[data-guide]'), t = e.target.closest('[data-travel]'), o = e.target.closest('[data-open]');
      if (g) { this.game.setNav(g.dataset.guide); this.sound.click(); q('directory').close(); if (!this.started) { /* guide set */ } }
      if (t) { this.sound.click(); q('directory').close(); this.game.fastTravel(t.dataset.travel); }
      if (o) { const m = MISSIONS.find((x) => x.id === o.dataset.open); q('directory').close(); setTimeout(() => this.openMission(m), 50); }
    });
  }
  _touch() {
    const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || new URLSearchParams(location.search).has('touch'); if (!coarse) return; q('touch').hidden = false; document.body.classList.add('is-touch');
    const joy = q('joy'), knob = q('joy-knob'); let pid = null, c = [0, 0], run = false; const set = (e) => { const r = joy.getBoundingClientRect(); const max = r.width / 2 - 14; let dx = e.clientX - c[0], dy = e.clientY - c[1]; const m = Math.hypot(dx, dy); if (m > max) { dx = (dx / m) * max; dy = (dy / m) * max; } knob.style.transform = `translate(${dx}px,${dy}px)`; const mag = Math.hypot(dx, dy) / max; if (mag < 0.15) this.game.setJoystick(0, 0, run); else this.game.setJoystick(dx / max, dy / max, run); };
    joy.addEventListener('pointerdown', (e) => { pid = e.pointerId; joy.setPointerCapture(pid); const r = joy.getBoundingClientRect(); c = [r.left + r.width / 2, r.top + r.height / 2]; this.sound.unlock(); set(e); e.preventDefault(); });
    joy.addEventListener('pointermove', (e) => { if (e.pointerId === pid) set(e); });
    const end = (e) => { if (e.pointerId !== pid) return; pid = null; knob.style.transform = 'translate(0,0)'; this.game.setJoystick(0, 0, run); }; joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
    q('btn-run').addEventListener('click', (e) => { run = !run; e.currentTarget.setAttribute('aria-pressed', String(run)); this.game.setJoystick(this.game.joy.x, this.game.joy.y, run); });
    q('btn-interact').addEventListener('click', () => { this.sound.unlock(); this.game.interact(); });
  }
}
