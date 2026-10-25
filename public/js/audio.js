// Narration (Web Speech API with a timed-caption fallback), sound effects and ambient music (Web Audio).
// Nothing plays until a user gesture; if audio is unavailable the captions keep running as text.

export function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
}

export class Narrator extends EventTarget {
  constructor(settings) {
    super();
    this.settings = settings; // {muted, textOnly, rate, voiceURI}
    this.lines = []; this.index = -1; this.state = 'idle'; // idle | playing | paused | done
    this.timer = null; this.token = 0; this.voices = [];
    this.supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    if (this.supported) {
      const load = () => { this.voices = speechSynthesis.getVoices(); this.dispatchEvent(new Event('voices')); };
      load(); speechSynthesis.addEventListener?.('voiceschanged', load);
    }
  }
  get speaking() { return this.state === 'playing'; }
  get current() { return this.lines[this.index] ?? ''; }
  usingVoice() { return this.supported && !this.settings.muted && !this.settings.textOnly && this.voices.length > 0; }

  load(text) { this.stop(); this.lines = Array.isArray(text) ? text : splitSentences(text); this.index = -1; this.state = 'idle'; this._emit(); }

  play(from = 0) { // must be triggered from a user gesture for sound
    if (!this.lines.length) return;
    this._cancelOutput();
    this.index = Math.max(0, Math.min(from, this.lines.length - 1));
    this.state = 'playing'; this._speakCurrent();
  }
  replay() { this.play(0); }
  pause() { if (this.state !== 'playing') return; this.state = 'paused'; this.token++; this._cancelOutput(); this._emit(); }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this._speakCurrent(); } }
  toggle() { if (this.state === 'playing') this.pause(); else if (this.state === 'paused') this.resume(); else this.play(this.state === 'done' ? 0 : Math.max(0, this.index)); }
  next() { if (this.index < this.lines.length - 1) { const was = this.state === 'playing'; this.index++; this._cancelOutput(); if (was) { this._speakCurrent(); } else { this.state = 'paused'; this._emit(); } } else this.skip(); }
  prev() { if (this.index > 0) { const was = this.state === 'playing'; this.index--; this._cancelOutput(); if (was) { this._speakCurrent(); } else { this.state = 'paused'; this._emit(); } } }
  skip() { this._cancelOutput(); this.token++; this.index = this.lines.length - 1; this.state = 'done'; this._emit(); this.dispatchEvent(new Event('end')); }
  stop() { this.token++; this._cancelOutput(); this.state = 'idle'; this._emit(); }
  applySettings() { if (this.state === 'playing') { this._cancelOutput(); this._speakCurrent(); } }

  _cancelOutput() { clearTimeout(this.timer); this.timer = null; if (this.supported) try { speechSynthesis.cancel(); } catch { /* ignore */ } }
  _emit() { this.dispatchEvent(new CustomEvent('change', { detail: { index: this.index, state: this.state, text: this.current, total: this.lines.length } })); }

  _advance(tok) {
    if (tok !== this.token || this.state !== 'playing') return;
    if (this.index >= this.lines.length - 1) { this.state = 'done'; this._emit(); this.dispatchEvent(new Event('end')); return; }
    this.index++; this._speakCurrent();
  }

  _speakCurrent() {
    const tok = ++this.token; const text = this.current; this._emit();
    const rate = this.settings.rate || 1;
    const fallbackMs = () => Math.max(1400, (text.split(/\s+/).length / (2.7 * rate)) * 1000);
    if (!this.usingVoice()) { this.timer = setTimeout(() => this._advance(tok), fallbackMs()); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate; u.pitch = 1.02; u.lang = 'en-IN';
      const v = this.voices.find((x) => x.voiceURI === this.settings.voiceURI) || this.voices.find((x) => /en[-_]IN/i.test(x.lang)) || this.voices.find((x) => /^en/i.test(x.lang));
      if (v) { u.voice = v; u.lang = v.lang; }
      let started = false;
      u.onstart = () => { started = true; };
      u.onend = () => this._advance(tok);
      u.onerror = (e) => { if (e.error === 'canceled' || e.error === 'interrupted') return; this._advance(tok); };
      speechSynthesis.cancel(); speechSynthesis.speak(u);
      // blocked/failed playback guard: if speech never starts, fall back to timed captions
      this.timer = setTimeout(() => { if (!started && tok === this.token) { try { speechSynthesis.cancel(); } catch { /* */ } this.timer = setTimeout(() => this._advance(tok), fallbackMs()); this.dispatchEvent(new CustomEvent('audiofail')); } }, 2500);
    } catch {
      this.timer = setTimeout(() => this._advance(tok), fallbackMs());
    }
  }
}

// ------------------------------------------------------------------ SFX + music
export class Sound {
  constructor(settings) { this.settings = settings; this.ctx = null; this.master = null; this.music = null; }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.settings.muted ? 0 : 0.5; this.master.connect(this.ctx.destination); } catch { this.ctx = null; }
    if (this.ctx && this.settings.music) this.startMusic();
  }
  setMuted(m) { if (this.master) this.master.gain.value = m ? 0 : 0.5; }
  tone(freq, dur = 0.12, type = 'sine', vol = 0.15, delay = 0, slideTo = null) {
    if (!this.ctx || this.settings.muted || !this.settings.sfx) return;
    const t = this.ctx.currentTime + delay; const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  click() { this.tone(660, 0.07, 'triangle', 0.12); }
  step() { this.tone(110 + Math.random() * 30, 0.05, 'sine', 0.05); }
  open() { this.tone(392, 0.12, 'triangle', 0.14); this.tone(587, 0.18, 'triangle', 0.14, 0.09); }
  close() { this.tone(587, 0.1, 'triangle', 0.12); this.tone(392, 0.14, 'triangle', 0.12, 0.08); }
  token() { this.tone(988, 0.08, 'square', 0.08); this.tone(1319, 0.14, 'square', 0.08, 0.07); }
  badge() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.16, i * 0.11)); }
  error() { this.tone(180, 0.2, 'sawtooth', 0.1, 0, 90); }
  success() { [440, 554, 659].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.14, i * 0.09)); }
  startMusic() {
    if (!this.ctx || this.music) return;
    // soft evolving pad: three detuned sines through a lowpass filter + slow LFO
    const c = this.ctx; const g = c.createGain(); g.gain.value = 0.0001; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const lfo = c.createOscillator(); const lg = c.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 250; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    const oscs = [196, 247, 294, 392].map((f, i) => { const o = c.createOscillator(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 1.5) * 6; const og = c.createGain(); og.gain.value = 0.05; o.connect(og); og.connect(lp); o.start(); return o; });
    lp.connect(g); g.connect(this.master); g.gain.exponentialRampToValueAtTime(0.5, c.currentTime + 3);
    this.music = { g, oscs, lfo };
  }
  stopMusic() { if (!this.music) return; const { g, oscs, lfo } = this.music; try { g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6); setTimeout(() => { oscs.forEach((o) => o.stop()); lfo.stop(); }, 700); } catch { /* */ } this.music = null; }
  setMusic(on) { this.settings.music = on; if (on) this.startMusic(); else this.stopMusic(); }
}
