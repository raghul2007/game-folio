// Quick Portfolio: a conventional, accessible recruiter view built from the same data as the game.
import { PROFILE, EDUCATION, SKILL_GROUPS, PRACTICE_AREAS, PROJECTS, ACHIEVEMENTS, CERT_CATEGORIES, CERTIFICATIONS, STARTUP } from './data.js';
import { esc, $, $$, resumeButton, linkedinButton, githubButton, emailButton, checkResume } from './util.js';

export function renderQuick(root, { onExplore }) {
  const actions = () => `${resumeButton()} ${githubButton()} ${linkedinButton()} ${emailButton()}`;
  root.innerHTML = `
    <header class="q-header"><div class="q-wrap row between"><a class="q-brand" href="#top">RAGHULVERSE</a>
      <nav aria-label="Sections"><a href="#q-edu">Education</a><a href="#q-skills">Skills</a><a href="#q-work">Practical work</a><a href="#q-ach">Achievements</a><a href="#q-certs">Certifications</a><a href="#q-contact">Contact</a></nav>
      <button class="btn primary" id="q-explore">Explore Campus (game)</button></div></header>
    <div class="q-wrap">
      <section class="q-hero" id="top"><p class="eyebrow">Quick Portfolio</p><h1>${esc(PROFILE.name)}</h1><p class="lead">${esc(PROFILE.role)}</p>
        <p>${esc(PROFILE.programme)} · ${esc(PROFILE.specialization)} specialization · ${esc(PROFILE.year)} · CGPA ${esc(PROFILE.cgpa)}</p><p>${esc(PROFILE.institution)} · ${esc(PROFILE.location)}</p>
        <div class="row gap wrap" id="q-actions">${actions()}</div></section>
      <section id="q-edu"><h2>Education</h2><div class="cards">${EDUCATION.map((e) => `<article class="card"><h3>${esc(e.level)}</h3><p>${esc(e.school)}</p><p><strong>${esc(e.years)}</strong> · ${esc(e.score)}</p></article>`).join('')}</div></section>
      <section id="q-skills"><h2>Skills</h2><div class="cards">${SKILL_GROUPS.map((g) => `<article class="card"><h3>${esc(g.name)}</h3><div class="chips">${g.items.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div></article>`).join('')}</div></section>
      <section id="q-work"><h2>Projects and practical experience</h2><ul class="plain-list">${PRACTICE_AREAS.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        ${PROJECTS.length ? `<div class="cards">${PROJECTS.map((p) => `<article class="card"><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${p.url ? `<a class="link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">View repository</a>` : ''}</article>`).join('')}</div>` : `<p>Source code is on GitHub: <a class="link" href="${esc(PROFILE.github)}" target="_blank" rel="noopener noreferrer">${esc(PROFILE.github)}</a></p>`}
        ${STARTUP.name ? `<p><strong>Innovation initiative:</strong> ${esc(STARTUP.name)}${STARTUP.url ? ` · <a class="link" href="${esc(STARTUP.url)}" target="_blank" rel="noopener noreferrer">website</a>` : ''}</p>` : ''}</section>
      <section id="q-ach"><h2>Achievements</h2><div class="cards">${ACHIEVEMENTS.map((a) => `<article class="card"><h3>${esc(a.title)}</h3><p>${esc(a.text)}</p></article>`).join('')}</div></section>
      <section id="q-certs"><h2>Certifications <span id="qc-count" class="muted"></span></h2>
        <div class="certbar"><label class="sr" for="qc-q">Search certifications</label><input id="qc-q" type="search" placeholder="Search certifications…" /></div>
        <div class="chips filters" role="group" aria-label="Filter by category"><button class="chip on" data-cat="" aria-pressed="true">All</button>${CERT_CATEGORIES.map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="false">${esc(c)}</button>`).join('')}</div>
        <div id="qc-grid" class="cards certs"></div></section>
      <section id="q-contact"><h2>Contact</h2><p>Email: <a class="link" href="mailto:${esc(PROFILE.email)}">${esc(PROFILE.email)}</a> · ${esc(PROFILE.location)}</p><div class="row gap wrap" id="q-actions2">${actions()}</div></section>
    </div><footer class="q-footer q-wrap"><p>Built with HTML, CSS and JavaScript. All artwork is original.</p></footer>`;

  let cat = ''; const q = $('#qc-q', root);
  const draw = () => { const s = q.value.trim().toLowerCase(); const hit = CERTIFICATIONS.filter((c) => (!cat || c.category === cat) && (!s || `${c.title} ${c.issuer} ${c.category}`.toLowerCase().includes(s))); $('#qc-count', root).textContent = `(${hit.length}/${CERTIFICATIONS.length})`; $('#qc-grid', root).innerHTML = hit.map((c) => `<article class="card cert"><span class="tag">${esc(c.category)}</span><h3>${esc(c.title)}</h3><p class="issuer">${esc(c.issuer)}</p>${c.credentialUrl ? `<a class="link" href="${esc(c.credentialUrl)}" target="_blank" rel="noopener noreferrer">Open verified credential</a>` : ''}</article>`).join('') || '<p>No certifications match.</p>'; };
  root.addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; cat = b.dataset.cat; $$('[data-cat]', root).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); }); draw(); });
  q.addEventListener('input', draw); draw();
  $('#q-explore', root).addEventListener('click', onExplore);
  checkResume().then(() => { const a = actions(); $('#q-actions', root).innerHTML = a; $('#q-actions2', root).innerHTML = a; });
}
