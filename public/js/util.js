import { PROFILE } from './data.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const mailto = () => `mailto:${PROFILE.email}?subject=${encodeURIComponent('Hello Raghul - from RAGHULVERSE')}`;
export const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

let resumeState = null; // null unknown | true | false
let resumePromise = null;
export function checkResume() {
  if (resumeState !== null) return Promise.resolve(resumeState);
  resumePromise ??= fetch(PROFILE.resumeUrl, { method: 'HEAD' })
    .then((r) => { const ct = r.headers.get('content-type') || ''; resumeState = r.ok && /pdf|octet/i.test(ct); return resumeState; })
    .catch(() => { resumeState = false; return false; });
  return resumePromise;
}
export const resumeKnown = () => resumeState;

// Buttons that always do something real: either a working link or an honest disabled state.
export function resumeButton(cls = 'btn primary') {
  if (resumeState === false) return `<button class="${cls}" disabled aria-disabled="true" title="The resume PDF has not been added to this deployment yet">Resume PDF - not added yet</button>`;
  return `<a class="${cls}" href="${esc(PROFILE.resumeUrl)}" download data-resume>Download Resume PDF</a>`;
}
export function linkedinButton(cls = 'btn') {
  return PROFILE.linkedin ? `<a class="${cls}" href="${esc(PROFILE.linkedin)}" target="_blank" rel="noopener noreferrer">View LinkedIn</a>` : `<button class="${cls}" disabled aria-disabled="true">LinkedIn - not set</button>`;
}
export const githubButton = (cls = 'btn') => `<a class="${cls}" href="${esc(PROFILE.github)}" target="_blank" rel="noopener noreferrer">View GitHub</a>`;
export const emailButton = (cls = 'btn') => `<a class="${cls}" href="${esc(mailto())}">Contact by Email</a>`;
