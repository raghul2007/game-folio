// Dependency-free test runner: node tests/run.mjs
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeServer } from '../server.mjs';
import * as D from '../public/js/data.js';
import { buildGrid, treeBlocked, findPath, nearestWalkable } from '../public/js/nav.js';
import { splitSentences } from '../public/js/audio.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  FAIL:', msg); } };
const section = (s) => console.log('\n# ' + s);

// ---------------------------------------------------------------- resume content
section('Resume content matches the brief');
const edu = Object.fromEntries(D.EDUCATION.map((e) => [e.id, e]));
ok(edu.mtech.years === '2024–2029' && edu.mtech.score === 'CGPA 8.85' && /SRM/.test(edu.mtech.school), 'M.Tech entry');
ok(edu.xii.years === '2023–2024' && edu.xii.score === '86.3%' && /JRK Matric Higher Secondary School, Kattankulathur/.test(edu.xii.school), 'Class XII entry');
ok(edu.x.years === '2021–2022' && edu.x.score === '71%' && /TMS Matric School, Rail Nagar/.test(edu.x.school), 'Class X entry');
ok(D.PROFILE.cgpa === '8.85' && D.PROFILE.email === 'sraghul240@gmail.com' && D.PROFILE.github === 'https://github.com/raghul2007', 'profile basics');
ok(D.PROFILE.linkedin === 'https://www.linkedin.com/in/raghul-s-82bb3a324', 'LinkedIn supplied by user');
ok(D.STARTUP.name === 'Tesseract Labs' && D.STARTUP.description === null && D.STARTUP.url === null, 'startup name only; nothing invented');
ok(D.SKILL_GROUPS.length === 8, '8 skill groups');
const skills = D.SKILL_GROUPS.flatMap((g) => g.items);
for (const s of ['Python', 'Java', 'C++', 'MATLAB', 'Next.js', 'Django', 'RAG', 'LangGraph', 'Power BI', 'Tableau', 'Kubernetes', 'CI/CD', 'Google Cloud']) ok(skills.includes(s), 'skill ' + s);
ok(D.CERTIFICATIONS.length === 29, `29 certifications (got ${D.CERTIFICATIONS.length})`);
ok(D.CERTIFICATIONS.every((c) => D.CERT_CATEGORIES.includes(c.category)), 'cert categories valid');
ok(D.CERTIFICATIONS.every((c) => c.credentialUrl === null && c.image === null), 'no invented credential URLs or images');
ok(D.CERTIFICATIONS.filter((c) => c.category === 'Key certifications').length === 9, '9 key certifications');
ok(new Set(D.CERTIFICATIONS.map((c) => c.title)).size === 29, 'cert titles unique');
ok(D.ACHIEVEMENTS.length === 3 && /third prize/i.test(D.ACHIEVEMENTS[0].text) && /Astral Web Innovate/.test(D.ACHIEVEMENTS[1].text) && /Designathon/.test(D.ACHIEVEMENTS[2].text), 'achievements');
ok(D.MISSIONS.length === 10 && D.MISSIONS.every((m, i) => m.order === i + 1), '10 ordered missions');
ok(D.MISSIONS.every((m) => m.badge && m.narration && splitSentences(m.narration).length >= 2), 'every mission has badge + multi-sentence narration');
ok(new Set(D.MISSIONS.map((m) => m.badge)).size === 10, 'unique badges');
ok(D.CAREER_REQUIRES.length === 8 && !D.CAREER_REQUIRES.includes('innovation'), 'Career Centre needs 8 required missions; innovation optional');
ok(D.PROJECTS.length === 0, 'no fabricated projects');
const noPct = JSON.stringify(D.SKILL_GROUPS);
ok(!/%|proficien|expert/i.test(noPct), 'no skill percentages or ratings');

// ---------------------------------------------------------------- world
section('World: collision grid, reachability');
const g = treeBlocked(buildGrid());
ok(g.length === D.MAP.rows && g[0].length === D.MAP.cols, 'grid size');
ok(!g[40][32], 'spawn walkable');
for (const m of D.MISSIONS) { ok(!g[m.door.y][m.door.x], `door walkable: ${m.id}`); ok(!!findPath(g, 32, 40, m.door.x, m.door.y), `door reachable: ${m.id}`); }
for (const t of D.TOKENS) { ok(!g[t.y][t.x], 'token walkable ' + t.id); ok(!!findPath(g, 32, 40, t.x, t.y), 'token reachable ' + t.id); }
D.NPC_ROUTES.forEach((r, i) => r.forEach(([x, y]) => ok(!g[y][x], `npc ${i} waypoint ${x},${y}`)));
for (const m of D.MISSIONS.filter((x) => x.rect)) { const { x, y, w, h } = m.rect; ok(g[y + 1][x + 1] && g[y + h - 1][x + w - 2], `building solid: ${m.id}`); }
ok(g[0][0] && g[43][63] && g[10][1] && g[10][62], 'boundary blocked');
const wall = g[36][10] && g[37][50]; ok(wall, 'compound wall blocks outside route');
ok(findPath(g, 32, 40, 32, 36) !== null, 'gate opening passable');
const np = nearestWalkable(g, 20, 17); ok(!g[np.y][np.x], 'nearestWalkable returns walkable tile');

// ---------------------------------------------------------------- html / js wiring
section('HTML ids referenced by JS exist in index.html');
const html = await readFile(join(root, 'public/index.html'), 'utf8');
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const jsDir = join(root, 'public/js'); const files = (await readdir(jsDir)).filter((f) => f.endsWith('.js'));
const dynamic = new Set(); // ids that panels/quick/ui create dynamically at runtime
for (const f of files) { const src = await readFile(join(jsDir, f), 'utf8'); for (const m of src.matchAll(/id="([^"$]+)"/g)) dynamic.add(m[1]); for (const m of src.matchAll(/<(?:button|a|div|canvas|form|input|span|p|ul|pre)[^>]*\bid=\\?"([^"$\\]+)/g)) dynamic.add(m[1]); }
const missing = [];
for (const f of ['ui.js', 'main.js', 'game.js']) {
  const src = await readFile(join(jsDir, f), 'utf8');
  for (const m of src.matchAll(/\bq\('([a-z0-9-]+)'\)|getElementById\('([a-z0-9-]+)'\)/g)) { const id = m[1] || m[2]; if (!htmlIds.has(id) && !dynamic.has(id)) missing.push(f + ':' + id); }
}
ok(missing.length === 0, 'missing ids: ' + [...new Set(missing)].join(', '));
ok(!/<img[^>]+src="(?!data:)/.test(html), 'no external image dependencies in index.html');
ok(/<script type="module" src="js\/main\.js">/.test(html), 'module entry');
const resumeIsLink = files.length > 0; ok(resumeIsLink, 'js modules present');

// ---------------------------------------------------------------- server + module graph
section('Server serves every module and import resolves');
const srv = makeServer(); await new Promise((r) => srv.listen(0, r)); const port = srv.address().port; const base = `http://127.0.0.1:${port}`;
for (const p of ['/', '/index.html', '/styles.css', ...files.map((f) => '/js/' + f)]) { const r = await fetch(base + p); ok(r.ok, `GET ${p} -> ${r.status}`); }
for (const f of files) { const src = await readFile(join(jsDir, f), 'utf8'); for (const m of src.matchAll(/(?:from|import\()\s*'(\.\/[^']+)'/g)) { const r = await fetch(base + '/js/' + m[1].slice(2)); ok(r.ok, `${f} imports ${m[1]}`); } }
const trav = await fetch(base + '/..%2f..%2fpackage.json'); ok(trav.status !== 200, 'path traversal blocked');
const resume = await fetch(base + '/' + D.PROFILE.resumeUrl, { method: 'HEAD' });
console.log(`  info: resume PDF present at /${D.PROFILE.resumeUrl}? ${resume.ok ? 'yes' : 'NO (UI shows an honest disabled state until the file is added)'}`);
srv.close();

// ---------------------------------------------------------------- narration splitter
section('Narration sentence splitting');
const s = splitSentences(D.INTRO_NARRATION); ok(s.length >= 3, 'intro splits into sentences'); ok(s.join(' ').replace(/\s+/g, ' ').length > 300, 'no text lost in split');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
