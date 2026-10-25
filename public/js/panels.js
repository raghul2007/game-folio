// Mission interiors: each renderer fills `root` with real, interactive content from data.js and returns a cleanup().
import { PROFILE, EDUCATION, SKILL_GROUPS, PRACTICE_AREAS, PROJECTS, ACHIEVEMENTS, CERT_CATEGORIES, CERTIFICATIONS, STARTUP } from './data.js';
import { esc, $, $$, resumeButton, linkedinButton, githubButton, emailButton, prefersReduced } from './util.js';
import { drawTesseract } from './holo.js';

const chips = (arr) => arr.map((x) => `<span class="chip">${esc(x)}</span>`).join('');
const reduced = () => prefersReduced() || document.documentElement.dataset.reduce === '1';

export function renderMission(m, root, env) {
  const fn = { about: about, education, skills, ai, fullstack, cloud, achievements, certs, innovation, career }[m.kind];
  const cleanups = []; const reg = (f) => cleanups.push(f);
  fn(root, env, reg, m);
  return () => cleanups.forEach((f) => { try { f(); } catch { /* ignore */ } });
}

// ------------------------------------------------------------------ 1. about
function about(root, env) {
  const rows = [['Name', PROFILE.name], ['Role', PROFILE.role], ['Programme', PROFILE.programme], ['Specialization', PROFILE.specialization], ['Institution', PROFILE.institution], ['Academic year', PROFILE.year], ['CGPA', PROFILE.cgpa]];
  root.innerHTML = `
    <div class="idgrid">${rows.map(([k, v], i) => `<div class="idcard" style="--i:${i}"><span class="idk">${esc(k)}</span><strong class="idv ${k === 'CGPA' ? 'big' : ''}">${esc(v)}</strong></div>`).join('')}</div>
    <h3>Interests</h3><div class="chips">${chips(PROFILE.interests)}</div>
    <div class="row gap"><a class="btn" href="${esc(PROFILE.github)}" target="_blank" rel="noopener noreferrer">GitHub</a>${linkedinButton()}</div>`;
}

// ------------------------------------------------------------------ 2. education
function education(root) {
  root.innerHTML = `
    <div class="gradboard" aria-hidden="true"><span>GRADUATION BOARD</span><b>Integrated M.Tech · 2024–2029</b></div>
    <ol class="timeline">${EDUCATION.map((e, i) => `
      <li style="--i:${i}"><button class="tl-node" aria-expanded="${i === 0}" data-i="${i}"><span class="tl-years">${esc(e.years)}</span><span class="tl-level">${esc(e.level)}</span><span class="tl-score">${esc(e.score)}</span></button>
        <div class="tl-detail" ${i === 0 ? '' : 'hidden'}><p><strong>${esc(e.school)}</strong></p><p>${esc(e.years)} · ${esc(e.score)}</p></div></li>`).join('')}</ol>`;
  root.addEventListener('click', (ev) => { const b = ev.target.closest('.tl-node'); if (!b) return; const open = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', String(!open)); b.nextElementSibling.hidden = open; });
}

// ------------------------------------------------------------------ 3. skills
function skills(root, env, reg) {
  root.innerHTML = `
    <div class="terminals">
      <div class="term-list" role="tablist" aria-label="Skill terminals">${SKILL_GROUPS.map((g, i) => `<button role="tab" class="term-btn" aria-selected="${i === 0}" data-i="${i}"><span class="term-ico">▣</span><span>Terminal ${i + 1}</span><b>${esc(g.name)}</b></button>`).join('')}</div>
      <div class="term-screen" role="tabpanel" aria-live="polite"><div class="term-bar"><i></i><i></i><i></i><span id="term-title"></span></div><pre id="term-out" class="term-out"></pre><div id="term-chips" class="chips"></div></div>
    </div>
    <details class="plain"><summary>Text list of all skills</summary><dl>${SKILL_GROUPS.map((g) => `<dt>${esc(g.name)}</dt><dd>${esc(g.items.join(', '))}</dd>`).join('')}</dl></details>
    <p class="note">Skills are listed as supplied; no proficiency ratings are shown.</p>`;
  let timer = 0;
  const show = (i) => {
    const g = SKILL_GROUPS[i]; $$('.term-btn', root).forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    $('#term-title', root).textContent = `raghul@srm-ktr: ~/${g.id}`; const out = $('#term-out', root); out.textContent = ''; $('#term-chips', root).innerHTML = '';
    clearInterval(timer); const text = `$ ls ${g.id}/\n` + g.snippet.join('\n') + `\n$ cat toolkit.txt`; let n = 0;
    const done = () => { out.textContent = text; $('#term-chips', root).innerHTML = g.items.map((s, k) => `<span class="chip pop" style="--i:${k}">${esc(s)}</span>`).join(''); };
    if (reduced()) { done(); return; }
    timer = setInterval(() => { n += 2; out.textContent = text.slice(0, n) + '▌'; if (n >= text.length) { clearInterval(timer); done(); } }, 18);
  };
  root.addEventListener('click', (e) => { const b = e.target.closest('.term-btn'); if (b) { env.sound.click(); show(+b.dataset.i); } });
  reg(() => clearInterval(timer)); show(0);
}

// ------------------------------------------------------------------ 4. AI centre
const AI_STATIONS = [
  { id: 'ml', name: 'Machine learning', text: 'Machine learning finds patterns in data so a model can make predictions on new examples. A typical workflow is: prepare data, split it into training and test sets, fit a model, then evaluate it.', viz: 'ml' },
  { id: 'dl', name: 'Deep learning', text: 'Deep learning stacks many layers of artificial neurons. Each layer transforms its input, letting the network learn increasingly abstract features from images, text or audio.', viz: 'dl' },
  { id: 'gen', name: 'Generative AI', text: 'Generative AI models, including large language models, produce new content such as text. They generate output one token at a time, each token conditioned on what came before.', viz: 'gen' },
  { id: 'rag', name: 'Retrieval-Augmented Generation', text: 'RAG gives a language model relevant documents at question time. The question is embedded, similar passages are retrieved from a knowledge base, and the model answers using them.', viz: 'rag' },
  { id: 'data', name: 'Data analytics', text: 'Data analytics turns raw tables into insight: cleaning, aggregating and visualising data so patterns and decisions become clear.', viz: 'data' },
];
function ai(root, env, reg) {
  root.innerHTML = `
    <div class="tabs" role="tablist">${AI_STATIONS.map((s, i) => `<button role="tab" class="tab" aria-selected="${i === 0}" data-i="${i}">${esc(s.name)}</button>`).join('')}</div>
    <div class="station"><canvas id="ai-viz" width="560" height="220" aria-label="Animated illustration"></canvas><div><h3 id="ai-title"></h3><p id="ai-text"></p><p class="note">Concept station: it explains the topic with an illustrative animation. It is not a claim about a specific project result.</p></div></div>
    <h3>Practical work areas</h3><ul class="plain-list">${PRACTICE_AREAS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    <p class="note">${PROJECTS.length ? '' : 'Named projects, datasets and metrics are not shown here until verified repositories are supplied. '}${githubButton('link')}</p>`;
  const cv = $('#ai-viz', root); const c = cv.getContext('2d'); let cur = 0, raf = 0; const t0 = performance.now();
  const sel = (i) => { cur = i; $$('.tab', root).forEach((b, k) => b.setAttribute('aria-selected', String(k === i))); $('#ai-title', root).textContent = AI_STATIONS[i].name; $('#ai-text', root).textContent = AI_STATIONS[i].text; };
  root.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) { env.sound.click(); sel(+b.dataset.i); } });
  const loop = (now) => { raf = requestAnimationFrame(loop); const t = reduced() ? 2 : (now - t0) / 1000; drawViz(c, cv.width, cv.height, AI_STATIONS[cur].viz, t); };
  raf = requestAnimationFrame(loop); reg(() => cancelAnimationFrame(raf)); sel(0);
}
function drawViz(c, w, h, kind, t) {
  c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(8,24,48,.9)'; c.fillRect(0, 0, w, h);
  c.font = '12px system-ui'; c.lineWidth = 2;
  if (kind === 'ml') {
    const pts = Array.from({ length: 36 }, (_, i) => { const r = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); }; const cls = i % 2; return { x: 30 + r(1) * (w - 60), y: 20 + r(2) * (h - 40), cls, bx: cls ? 0.6 : 0.2 }; });
    pts.forEach((p) => { const px = 30 + (p.cls ? 0.55 : 0.1) * (w - 60) + (p.x - 30) * 0.35; const py = 20 + (p.y - 20) * 0.9; c.fillStyle = p.cls ? '#ffd166' : '#38e1ff'; c.beginPath(); c.arc(px, py, 4, 0, 6.3); c.fill(); });
    const ang = Math.sin(t * 0.8) * 0.2; c.strokeStyle = '#fff'; c.setLineDash([6, 5]); c.beginPath(); c.moveTo(w / 2 - Math.tan(ang) * 100, 10); c.lineTo(w / 2 + Math.tan(ang) * 100, h - 10); c.stroke(); c.setLineDash([]); c.fillStyle = '#fff'; c.fillText('decision boundary is being fitted (illustrative)', 12, h - 8);
  } else if (kind === 'dl') {
    const L = [4, 6, 6, 3]; const pts = L.map((n, li) => Array.from({ length: n }, (_, k) => [60 + li * ((w - 120) / 3), (h / (n + 1)) * (k + 1)]));
    for (let li = 0; li < 3; li++) for (const a of pts[li]) for (const b of pts[li + 1]) { c.strokeStyle = 'rgba(56,225,255,.18)'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); const p = (t * 0.7 + a[1] / 90 + b[1] / 70) % 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, 1.8, 0, 6.3); c.fill(); }
    pts.forEach((col, li) => col.forEach((p) => { c.fillStyle = ['#38e1ff', '#7aa2ff', '#7aa2ff', '#ffd166'][li]; c.beginPath(); c.arc(p[0], p[1], 7, 0, 6.3); c.fill(); }));
    c.fillStyle = '#fff'; ['input', 'hidden', 'hidden', 'output'].forEach((s, i) => c.fillText(s, 40 + i * ((w - 120) / 3), h - 6));
  } else if (kind === 'gen') {
    const toks = ['Data', ' turns', ' into', ' useful', ' answers', ' with', ' language', ' models', '.']; const n = Math.min(toks.length, Math.floor(t * 2.2) % (toks.length + 4));
    c.fillStyle = '#7aa2ff'; c.fillText('prompt:', 16, 28); c.fillStyle = '#fff'; c.font = '15px monospace'; c.fillText('Explain data + LLMs in one line', 16, 52); c.font = '12px system-ui'; c.fillStyle = '#7aa2ff'; c.fillText('generated token by token:', 16, 92);
    let x = 16; c.font = '16px monospace'; for (let i = 0; i < n; i++) { const wd = c.measureText(toks[i]).width + 12; c.fillStyle = i === n - 1 ? '#ffd166' : '#38e1ff'; c.globalAlpha = i === n - 1 ? 1 : 0.85; c.fillRect(x, 108, wd, 28); c.fillStyle = '#06203a'; c.fillText(toks[i], x + 6, 128); c.globalAlpha = 1; x += wd + 4; }
    c.font = '12px system-ui'; c.fillStyle = '#fff'; c.fillText('illustrative sentence, not a real model output', 16, h - 8);
  } else if (kind === 'rag') {
    const steps = ['Question', 'Embed', 'Retrieve', 'Generate', 'Answer']; const bw = (w - 40) / steps.length; const act = Math.floor(t * 1.1) % steps.length;
    steps.forEach((s, i) => { const x = 20 + i * bw; c.fillStyle = i === act ? '#ffd166' : 'rgba(56,225,255,.25)'; c.fillRect(x + 4, 70, bw - 22, 56); c.fillStyle = i === act ? '#06203a' : '#fff'; c.font = '600 13px system-ui'; c.textAlign = 'center'; c.fillText(s, x + bw / 2 - 7, 103); c.textAlign = 'left'; if (i < steps.length - 1) { c.fillStyle = '#fff'; c.fillText('→', x + bw - 16, 103); } });
    c.fillStyle = '#7aa2ff'; c.font = '12px system-ui'; for (let k = 0; k < 4; k++) { const y = 150 + k * 14; c.globalAlpha = act === 2 ? 1 : 0.35; c.fillRect(20, y, 90 + k * 50, 6); } c.globalAlpha = 1; c.fillStyle = '#fff'; c.fillText('knowledge base passages', 20, 146);
  } else {
    const vals = [38, 62, 47, 80, 55, 92]; const bw = (w - 80) / vals.length; const grow = Math.min(1, (t % 4) / 1.2);
    vals.forEach((v, i) => { const hh = (v / 100) * (h - 70) * grow; c.fillStyle = i % 2 ? '#38e1ff' : '#7aa2ff'; c.fillRect(40 + i * bw + 6, h - 30 - hh, bw - 14, hh); });
    c.strokeStyle = '#ffd166'; c.beginPath(); vals.forEach((v, i) => { const x = 40 + i * bw + bw / 2, y = h - 30 - (v / 100) * (h - 70) * grow; if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke(); c.fillStyle = '#fff'; c.font = '12px system-ui'; c.fillText('illustrative sample data', 16, 16);
  }
}

// ------------------------------------------------------------------ 5. full stack
const STACK_GROUPS = [['Frontend', ['HTML', 'CSS', 'JavaScript', 'React', 'Angular', 'Next.js', 'Bootstrap']], ['Backend', ['Node.js', 'Django']], ['Data', ['SQL', 'MySQL']], ['Workflow', ['Git', 'GitHub']]];
function fullstack(root, env, reg) {
  const all = SKILL_GROUPS.flatMap((g) => g.items.map((i) => ({ i, g: g.name })));
  root.innerHTML = `
    <div class="stackgrid">${STACK_GROUPS.map(([n, items]) => `<div class="stackcol"><h4>${n}</h4>${chips(items)}</div>`).join('')}</div>
    <h3>Working terminal</h3>
    <div class="term-screen"><div class="term-bar"><i></i><i></i><i></i><span>raghulverse-shell</span></div><div id="sh-out" class="term-out" role="log" aria-live="polite">Type <b>help</b> to see commands.</div>
      <form id="sh-form" class="sh-form" autocomplete="off"><label for="sh-in" class="sr">Terminal command</label><span>$</span><input id="sh-in" type="text" spellcheck="false" placeholder="help" /></form></div>
    <h3>Portfolio demo: skills explorer</h3>
    <div class="demo" aria-label="Portfolio demo"><div class="demo-tag">PORTFOLIO DEMO · built for this game, not a client project · bars count listed technologies, not proficiency</div>
      <input id="demo-q" type="search" placeholder="Filter technologies..." aria-label="Filter technologies" />
      <div id="demo-bars" class="bars"></div><div id="demo-res" class="chips"></div></div>
    <h3>Projects</h3>${PROJECTS.length ? `<div class="cards">${PROJECTS.map((p) => `<article class="card"><h4>${esc(p.title)}</h4><p>${esc(p.description)}</p>${chips(p.stack || [])}${p.url ? `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">View repository</a>` : ''}</article>`).join('')}</div>` : `<p class="note">Project repositories are kept on GitHub. ${githubButton('link')}</p>`}`;
  // terminal
  const out = $('#sh-out', root), form = $('#sh-form', root), inp = $('#sh-in', root); const hist = []; let hi = 0;
  const print = (s) => { const d = document.createElement('div'); d.textContent = s; out.appendChild(d); out.scrollTop = out.scrollHeight; };
  const cmds = {
    help: () => ['commands: whoami, education, skills [category], stack, projects, github, linkedin, email, open <github|linkedin|email>, clear'],
    whoami: () => [`${PROFILE.name} - ${PROFILE.programme} (${PROFILE.specialization}), ${PROFILE.institution}`],
    education: () => EDUCATION.map((e) => `${e.years}  ${e.level} - ${e.score}`),
    skills: (a) => { if (!a) return SKILL_GROUPS.map((g) => `${g.id.padEnd(7)} ${g.name}`).concat(['usage: skills <id>']); const g = SKILL_GROUPS.find((x) => x.id === a.toLowerCase()); return g ? [`${g.name}: ${g.items.join(', ')}`] : [`unknown category "${a}"`]; },
    stack: () => STACK_GROUPS.map(([n, i]) => `${n}: ${i.join(', ')}`),
    projects: () => (PROJECTS.length ? PROJECTS.map((p) => `${p.title} - ${p.url || ''}`) : ['No named repositories listed here. See GitHub: ' + PROFILE.github]),
    github: () => [PROFILE.github], linkedin: () => [PROFILE.linkedin || 'LinkedIn is not set'], email: () => [PROFILE.email],
    open: (a) => { const u = { github: PROFILE.github, linkedin: PROFILE.linkedin, email: `mailto:${PROFILE.email}` }[(a || '').toLowerCase()]; if (!u) return ['usage: open <github|linkedin|email>']; window.open(u, '_blank', 'noopener'); return ['opening ' + a + '...']; },
    clear: () => { out.textContent = ''; return []; },
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); const line = inp.value.trim(); inp.value = ''; if (!line) return; hist.push(line); hi = hist.length; print('$ ' + line); const [c, ...rest] = line.split(/\s+/); const f = cmds[c.toLowerCase()]; if (!f) { print(`command not found: ${c} (try help)`); env.sound.error(); } else { f(rest.join(' ')).forEach(print); env.sound.click(); } });
  inp.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); } else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; e.preventDefault(); } e.stopPropagation(); });
  inp.addEventListener('keyup', (e) => e.stopPropagation());
  // demo
  const q = $('#demo-q', root); q.addEventListener('keydown', (e) => e.stopPropagation());
  const drawDemo = () => { const s = q.value.trim().toLowerCase(); const hit = all.filter((x) => !s || x.i.toLowerCase().includes(s) || x.g.toLowerCase().includes(s)); const max = Math.max(...SKILL_GROUPS.map((g) => g.items.length)); $('#demo-bars', root).innerHTML = SKILL_GROUPS.map((g) => { const n = hit.filter((x) => x.g === g.name).length; return `<div class="bar"><span>${esc(g.name)}</span><div><i style="width:${(n / max) * 100}%"></i></div><b>${n}</b></div>`; }).join(''); $('#demo-res', root).innerHTML = hit.map((x) => `<span class="chip">${esc(x.i)}</span>`).join('') || '<span class="note">No match</span>'; };
  q.addEventListener('input', drawDemo); drawDemo();
}

// ------------------------------------------------------------------ 6. cloud + networking puzzle
const NET_CONCEPTS = [['VLAN', 'Splits one physical network into separate logical networks.'], ['DHCP', 'Automatically hands out IP addresses to devices.'], ['DNS', 'Translates names like example.com into IP addresses.'], ['NAT/PAT', 'Lets many private devices share a public address.'], ['ACLs', 'Rules that permit or deny traffic.'], ['Docker', 'Packages an app and its dependencies into a container.'], ['Kubernetes', 'Schedules and manages many containers.']];
const NODES = { client: ['Client', 10, 30, '💻'], switch: ['Switch', 33, 30, '🔀'], router: ['Router', 56, 30, '📡'], dns: ['DNS Server', 80, 11, '📖'], cloud: ['Cloud Endpoint', 82, 49, '☁️'] };
const VALID = ['client|switch', 'router|switch', 'dns|router', 'cloud|router'];
const WHY = {
  'client|router': 'A client plugs into a switch first; the switch then reaches the router.', 'client|dns': 'Clients ask DNS through the router (their gateway), not directly.', 'client|cloud': 'Traffic to the cloud must leave the local network through the router.',
  'dns|switch': 'In this puzzle the DNS server sits behind the router.', 'cloud|switch': 'Only the router (gateway) connects the local network to the cloud.', 'cloud|dns': 'DNS answers name lookups; it is not the path to the endpoint.',
};
const keyOf = (a, b) => [a, b].sort().join('|');
function cloud(root, env, reg) {
  root.innerHTML = `
    <div class="chips">${chips(['AWS', 'Google Cloud', 'Cloud computing concepts', 'Google Cloud labs', 'Networking concepts'])}</div>
    <div class="cards small">${NET_CONCEPTS.map(([n, d]) => `<article class="card"><h4>${n}</h4><p>${d}</p></article>`).join('')}</div>
    <p class="note">Concept summaries only. No production cloud ownership is claimed.</p>
    <h3>Puzzle: connect the network</h3>
    <p id="net-help">Goal: build a path so the client can reach the cloud endpoint. Select one device, then another to link them (select the same link again to remove it). Then press <b>Check network</b>.</p>
    <div class="netboard" id="net-board"><svg viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><g id="net-lines"></g><circle id="net-pkt" r="1.6" cx="-5" cy="-5" fill="#ffd166"/></svg>
      ${Object.entries(NODES).map(([id, [n, x, y, ic]]) => `<button class="node" data-id="${id}" aria-pressed="false" style="left:${x}%;top:${(y / 60) * 100}%"><span>${ic}</span>${n}</button>`).join('')}</div>
    <div class="row gap"><button class="btn primary" id="net-check">Check network</button><button class="btn" id="net-reset">Reset</button></div>
    <p id="net-msg" class="net-msg" role="status" aria-live="polite">No links yet.</p>
    <ul id="net-list" class="plain-list" aria-label="Current links"></ul>`;
  const edges = new Set(); let sel = null; const msg = $('#net-msg', root); const lines = $('#net-lines', root); const board = $('#net-board', root);
  const say = (t, kind = '') => { msg.textContent = t; msg.className = 'net-msg ' + kind; };
  const xy = (id) => [NODES[id][1], NODES[id][2]];
  const draw = (hl = []) => {
    lines.innerHTML = [...edges].map((k) => { const [a, b] = k.split('|'); const [x1, y1] = xy(a), [x2, y2] = xy(b); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hl.includes(k) ? '#ffd166' : '#38e1ff'}" stroke-width="0.9" stroke-linecap="round"/>`; }).join('');
    $('#net-list', root).innerHTML = [...edges].map((k) => { const [a, b] = k.split('|'); return `<li>${NODES[a][0]} ↔ ${NODES[b][0]} <button class="link" data-rm="${k}">remove</button></li>`; }).join('') || '<li>none</li>';
    $$('.node', root).forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.id === sel)));
  };
  const connect = (a, b) => {
    const k = keyOf(a, b);
    if (edges.has(k)) { edges.delete(k); say(`Removed link ${NODES[a][0]} ↔ ${NODES[b][0]}.`); env.sound.click(); }
    else if (VALID.includes(k)) { edges.add(k); say(`Linked ${NODES[a][0]} ↔ ${NODES[b][0]}.`, 'ok'); env.sound.success(); }
    else { say(`Invalid link: ${WHY[k] || 'those devices are not directly connected.'}`, 'bad'); env.sound.error(); }
    draw();
  };
  board.addEventListener('click', (e) => { const n = e.target.closest('.node'); if (!n) return; const id = n.dataset.id; if (!sel) { sel = id; say(`Selected ${NODES[id][0]}. Now choose a device to link it to.`); } else if (sel === id) { sel = null; say('Selection cleared.'); } else { const a = sel; sel = null; connect(a, id); } draw(); });
  root.addEventListener('click', (e) => { const r = e.target.closest('[data-rm]'); if (r) { edges.delete(r.dataset.rm); say('Link removed.'); draw(); } });
  let timers = [];
  $('#net-reset', root).addEventListener('click', () => { timers.forEach(clearTimeout); timers = []; edges.clear(); sel = null; $('#net-pkt', root).setAttribute('cx', -5); say('Network reset. No links yet.'); draw(); env.sound.click(); });
  $('#net-check', root).addEventListener('click', () => {
    const missing = VALID.filter((k) => !edges.has(k));
    if (missing.length) { const hints = missing.map((k) => k.split('|').map((i) => NODES[i][0]).join(' ↔ ')); say(`Not connected yet. Missing ${missing.length} link${missing.length > 1 ? 's' : ''}: ${hints.join('; ')}.`, 'bad'); env.sound.error(); return; }
    env.sound.success(); say('Network complete. Tracing a request...', 'ok');
    const path = [['client', 'switch'], ['switch', 'router'], ['router', 'dns'], ['dns', 'router'], ['router', 'cloud'], ['cloud', 'router'], ['router', 'switch'], ['switch', 'client']];
    const captions = ['Client asks its switch…', '…which forwards to the router…', '…which asks the DNS server for the cloud endpoint’s address…', '…DNS answers with the address…', '…router sends the request to the cloud endpoint…', '…the endpoint replies…', '…back through the router…', 'Client receives the response. Success!'];
    const pkt = $('#net-pkt', root); const step = (i) => { if (i >= path.length) { pkt.setAttribute('cx', -5); say('Success: DNS resolved the name and the request reached the cloud endpoint and came back.', 'ok'); env.sound.badge(); return; } const [a, b] = path[i]; draw([keyOf(a, b)]); say(captions[i], 'ok'); const [x1, y1] = xy(a), [x2, y2] = xy(b); const t0 = performance.now(); const dur = reduced() ? 1 : 650; const mv = (now) => { const p = Math.min(1, (now - t0) / dur); pkt.setAttribute('cx', x1 + (x2 - x1) * p); pkt.setAttribute('cy', y1 + (y2 - y1) * p); if (p < 1) timers.push(setTimeout(() => mv(performance.now()), 16)); else timers.push(setTimeout(() => step(i + 1), reduced() ? 10 : 120)); }; mv(performance.now()); };
    step(0);
  });
  reg(() => timers.forEach(clearTimeout)); draw();
}

// ------------------------------------------------------------------ 7. achievements
const medal = (c1, c2) => `<svg viewBox="0 0 64 80" width="64" height="80" aria-hidden="true"><path d="M18 0h12l6 26H24z" fill="#c0392b"/><path d="M46 0H34l-6 26h12z" fill="#1f6feb"/><circle cx="32" cy="50" r="22" fill="${c1}" stroke="${c2}" stroke-width="3"/><circle cx="32" cy="50" r="14" fill="none" stroke="${c2}" stroke-width="2" opacity=".6"/><path d="M32 38l3.5 7.5 8 1-6 5.5 1.8 8L32 56l-7.3 4 1.8-8-6-5.5 8-1z" fill="${c2}" opacity=".85"/></svg>`;
function achievements(root) {
  root.innerHTML = `<div class="cards trophies">${ACHIEVEMENTS.map((a, i) => `<article class="card trophy" style="--i:${i}">${a.type === 'prize' ? medal('#cd7f32', '#8a4d16') : medal('#dfe6f1', '#7a8aa5')}<h4>${esc(a.title)}</h4><p>${esc(a.text)}</p><span class="tag ${a.type}">${a.type === 'prize' ? 'Prize' : 'Participation'}</span></article>`).join('')}</div>
    <p class="note">Illustrations are original artwork. Event dates, team names and certificates are not shown because none were supplied.</p>`;
}

// ------------------------------------------------------------------ 8. certification library
function certs(root, env) {
  root.innerHTML = `
    <div class="certbar"><label class="sr" for="cert-q">Search certifications</label><input id="cert-q" type="search" placeholder="Search by title, issuer or category…" /><span id="cert-count" aria-live="polite"></span></div>
    <div class="chips filters" role="group" aria-label="Filter by category"><button class="chip on" data-cat="" aria-pressed="true">All</button>${CERT_CATEGORIES.map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>
    <div id="cert-grid" class="cards certs"></div>
    <p class="note">Issuers are shown as listed in the resume. Credential links and certificate images appear on a card only once the real ones are added.</p>`;
  let cat = ''; const q = $('#cert-q', root); q.addEventListener('keydown', (e) => e.stopPropagation()); q.addEventListener('keyup', (e) => e.stopPropagation());
  const draw = () => {
    const s = q.value.trim().toLowerCase(); const hit = CERTIFICATIONS.filter((c) => (!cat || c.category === cat) && (!s || `${c.title} ${c.issuer} ${c.category}`.toLowerCase().includes(s)));
    $('#cert-count', root).textContent = `${hit.length} of ${CERTIFICATIONS.length}`;
    $('#cert-grid', root).innerHTML = hit.map((c) => `<article class="card cert"><span class="tag">${esc(c.category)}</span><h4>${esc(c.title)}</h4><p class="issuer">${esc(c.issuer)}</p>${c.image ? `<img loading="lazy" alt="Certificate: ${esc(c.title)}" src="${esc(c.image)}" />` : ''}${c.credentialUrl ? `<a class="link" href="${esc(c.credentialUrl)}" target="_blank" rel="noopener noreferrer">Open verified credential</a>` : ''}</article>`).join('') || '<p class="note">No certifications match your search.</p>';
  };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; $$('[data-cat]', root).forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); }); env.sound.click(); draw(); });
  q.addEventListener('input', draw); draw();
}

// ------------------------------------------------------------------ 9. innovation pavilion
const INNO_PANELS = [['AI and innovation ideas', 'A space for exploring AI-driven ideas and practical uses of language models and data.'], ['Technology experiments', 'Hands-on experiments to learn new tools and techniques by building with them.'], ['Community activities', 'Learning alongside others through hackathons, designathons and shared projects.'], ['Project demonstrations', 'A place to show working ideas once projects are ready to share.'], ['Future goals', 'Growing as a developer and building useful technology solutions.']];
function innovation(root, env, reg) {
  const name = STARTUP.name;
  root.innerHTML = `
    <div class="inno-head"><canvas id="tess" width="220" height="180" aria-hidden="true"></canvas><div><h3>${name ? esc(name) : 'Innovation initiative'}</h3><p>${STARTUP.description ? esc(STARTUP.description) : 'An innovation initiative associated with Raghul, reflecting his interest in experimentation and creating useful technology projects.'}</p>${STARTUP.url ? `<a class="btn" href="${esc(STARTUP.url)}" target="_blank" rel="noopener noreferrer">Visit ${esc(name || 'site')}</a>` : ''}</div></div>
    <div class="tabs" role="tablist">${INNO_PANELS.map(([n], i) => `<button role="tab" class="tab" aria-selected="${i === 0}" data-i="${i}">${esc(n)}</button>`).join('')}</div>
    <div class="station"><div><h4 id="in-t"></h4><p id="in-d"></p><p class="note">This pavilion describes intent only. No company registration, revenue, team or client details are claimed.</p></div></div>`;
  const sel = (i) => { $$('.tab', root).forEach((b, k) => b.setAttribute('aria-selected', String(k === i))); $('#in-t', root).textContent = INNO_PANELS[i][0]; $('#in-d', root).textContent = INNO_PANELS[i][1]; };
  root.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) { env.sound.click(); sel(+b.dataset.i); } }); sel(0);
  const cv = $('#tess', root); let raf = 0; const t0 = performance.now(); const loop = (now) => { raf = requestAnimationFrame(loop); drawTesseract(cv, reduced() ? 1 : (now - t0) / 1000); }; raf = requestAnimationFrame(loop); reg(() => cancelAnimationFrame(raf));
}

// ------------------------------------------------------------------ 10. career centre
function career(root, env, reg) {
  const certCount = CERTIFICATIONS.length;
  root.innerHTML = `
    <div class="elevator" aria-hidden="true"><div class="door l"></div><div class="door r"></div><span>CAREER CENTRE · FLOOR 10</span></div>
    <div class="holo-resume"><h3>Holographic resume</h3>
      <p><strong>${esc(PROFILE.name)}</strong> · ${esc(PROFILE.programme)} (${esc(PROFILE.specialization)})</p>
      <p>${esc(PROFILE.institution)} · CGPA ${esc(PROFILE.cgpa)} · ${esc(PROFILE.location)}</p>
      <div class="chips">${chips(SKILL_GROUPS.flatMap((g) => g.items).slice(0, 14))}<span class="chip">+ more</span></div>
      <p>${ACHIEVEMENTS.length} achievements · ${certCount} certifications</p></div>
    <div class="row gap wrap" id="career-actions">${resumeButton()} ${githubButton()} ${linkedinButton()} ${emailButton()}</div>
    <div class="row gap wrap"><button class="btn" data-act="replay">Replay the portfolio tour</button><button class="btn" data-act="quick">View the conventional portfolio</button><button class="btn" data-act="close">Return to campus exploration</button></div>
    <div class="board"><h3>Opportunity board</h3><ul class="plain-list"><li>Interested in opportunities to apply these skills and build useful solutions.</li><li>Keen to keep growing as a developer.</li><li>Areas: ${esc(PROFILE.interests.join(', '))}.</li></ul></div>
    <p class="note">${esc(PROFILE.email)} · ${esc(PROFILE.location)}</p>`;
  root.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); if (!a) return; env.sound.click(); env.actions[a.dataset.act]?.(); });
  env.checkResume().then(() => { const box = $('#career-actions', root); if (box) box.innerHTML = `${resumeButton()} ${githubButton()} ${linkedinButton()} ${emailButton()}`; });
}
