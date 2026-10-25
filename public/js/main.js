// Bootstraps RAGHULVERSE. If the canvas game cannot start, the Quick Portfolio is shown instead.
import { Store } from './progress.js';
import { Narrator, Sound } from './audio.js';
import { buildSpriteSheet, PALETTES } from './art.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { renderQuick } from './quick.js';

function fallbackToQuick(reason) {
  console.warn('Game renderer unavailable, showing Quick Portfolio:', reason);
  const app = document.getElementById('app'); const quick = document.getElementById('quick');
  renderQuick(quick, { onExplore: () => location.reload() });
  app.hidden = true; quick.hidden = false; document.body.dataset.view = 'quick';
  const note = document.createElement('p'); note.className = 'note q-wrap'; note.setAttribute('role', 'status');
  note.textContent = 'The interactive campus could not start in this browser, so the Quick Portfolio is shown instead.';
  quick.prepend(note);
}

function boot() {
  const canvas = document.getElementById('game');
  if (!canvas?.getContext || !canvas.getContext('2d')) return fallbackToQuick('no 2D canvas');
  let store, game, ui;
  try {
    store = new Store();
    const narrator = new Narrator(store.settings);
    const sound = new Sound(store.settings);
    const sheet = buildSpriteSheet(PALETTES.raghul);
    game = new Game(canvas, store, sheet);
    ui = new UI({ game, store, narrator, sound });
    ui.init();
    game.start();
  } catch (err) {
    console.error(err);
    return fallbackToQuick(err);
  }
  window.__raghulverse = { game, ui, store }; // handy for debugging and automated tests
  window.addEventListener('pagehide', () => { try { ui.narrator.stop(); } catch { /* ignore */ } });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
