// Local persistence for settings and progress. Only non-sensitive game state is stored.
import { MISSIONS, TOKENS, CAREER_REQUIRES } from './data.js';

const KEY = 'raghulverse.v1';
const DEFAULT_SETTINGS = { muted: false, textOnly: false, rate: 1, voiceURI: '', music: true, sfx: true, reduceMotion: null, quality: 'auto', time: 'day', captions: true };

function safeGet() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } }
function safeSet(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage may be blocked */ } }

export class Store extends EventTarget {
  constructor() {
    super();
    const raw = safeGet();
    this.settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
    this.visited = new Set(raw.visited || []);   // missions opened
    this.completed = new Set(raw.completed || []); // missions finished (badge earned)
    this.tokens = new Set(raw.tokens || []);
    this.seenIntro = !!raw.seenIntro;
  }
  save() { safeSet({ settings: this.settings, visited: [...this.visited], completed: [...this.completed], tokens: [...this.tokens], seenIntro: this.seenIntro }); this.dispatchEvent(new Event('change')); }
  set(k, v) { this.settings[k] = v; this.save(); }
  visit(id) { this.visited.add(id); this.save(); }
  complete(id) { if (this.completed.has(id)) return false; this.completed.add(id); this.save(); return true; }
  collect(id) { if (this.tokens.has(id)) return false; this.tokens.add(id); this.save(); return true; }
  isUnlocked(id) { if (id !== 'career') return true; return CAREER_REQUIRES.every((m) => this.completed.has(m)); }
  get percent() { return Math.round((this.completed.size / MISSIONS.length) * 100); }
  // visited buildings + collected tokens (world coins and mission tokens) over everything collectable
  get tokenTotal() { return TOKENS.length + MISSIONS.length; }
  get explorePercent() { return Math.min(100, Math.round(((this.visited.size + this.tokens.size) / (MISSIONS.length + this.tokenTotal)) * 100)); }
  get allDone() { return MISSIONS.filter((m) => m.required).every((m) => this.completed.has(m.id)); }
  reset() { this.visited.clear(); this.completed.clear(); this.tokens.clear(); this.seenIntro = false; this.save(); }
}
