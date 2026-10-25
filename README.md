# RAGHULVERSE: Explore My World

> One Campus. One Journey. A Thousand Possibilities.

An interactive portfolio game for **Raghul S**. Visitors walk a cartoon version of Raghul around an illustrated SRM KTR campus; each building opens a mission that presents one part of his resume with text, animation, synthetic voice-over and captions. A conventional **Quick Portfolio** view is included for recruiters who would rather not play.

It is a static site (HTML + CSS + ES modules + Canvas). No build step, no packages, no backend.

## Run locally

```bash
node server.mjs          # http://localhost:3000   (any static server works; serve the ./public folder)
node server.mjs 8080     # custom port
```

Requires Node 18+. Opening `public/index.html` directly from disk will not work because browsers block ES modules on `file://`.

## Test

```bash
node tests/run.mjs                 # 163 checks: resume data, world reachability, HTML wiring, server
pip install playwright && playwright install chromium
python3 tests/e2e.py [out_dir]     # 111 browser checks + console-error capture + screenshots
```

The e2e run plays the real game: intro, WASD/arrows/Shift, collision and boundaries, modals freezing movement, walking to a door and pressing E, all 10 missions, the networking puzzle (valid and invalid links, reset, success), certificate search and filters, Quick Portfolio, persistence and reset, mobile touch (joystick + Enter), reduced motion, and a browser with **no** Speech API.

## Deploy to Vercel

1. Put the resume at `public/documents/Raghul_S_Resume.pdf` (see below).
2. Push this folder to GitHub, then in Vercel choose **Add New → Project → Import** the repo.
3. Framework preset **Other**. `vercel.json` already sets the output directory to `public`; no build command is needed.
4. Deploy. Or from the CLI: `npx vercel --prod`.

No environment variables are needed, so there is no `.env.example`.

## Content you control

All portfolio content lives in **`public/js/data.js`**. Nothing is hard-coded in components.

| To do this | Edit |
|---|---|
| Add the resume PDF | drop it at `public/documents/Raghul_S_Resume.pdf` (path in `PROFILE.resumeUrl`) |
| Change LinkedIn / email / GitHub | `PROFILE` |
| Add real projects | `PROJECTS` (`title, description, stack[], url`); they appear in Full-Stack Hub and Quick Portfolio |
| Add a certificate image or verification link | the matching entry in `CERTIFICATIONS` (`image`, `credentialUrl`) |
| Describe Tesseract Labs / link it | `STARTUP.description`, `STARTUP.url` |
| Change narration scripts | `MISSIONS[i].narration`, `INTRO_NARRATION` |

Buttons never pretend to work: until the resume PDF exists, *Download Resume* is shown disabled with an honest label; a missing LinkedIn/credential URL hides or disables its button.

## How it plays

- **Move** W A S D / arrows, **Shift** run, **E / Enter** interact, **Space** pause/resume narration, **M** minimap, **J** journal, **Esc** pause or close.
- **Touch**: left joystick, Run toggle, Enter button; tap a building to be guided there.
- Walk to a glowing door → press E → the mission panel opens with a talking hologram of Raghul, a content area, and narration controls (play/pause, previous/next line, replay, skip, mute, text-only, voice, speed).
- Claim a badge by finishing/skipping the narration or pressing **Claim badge**. You are never forced to listen.
- 9 required missions plus the optional Innovation pavilion. **The Career Centre unlocks after the 8 other required missions.** 12 tech coins are scattered across the campus.
- **Directory** offers *Guide me* (A* route drawn on the map and minimap; you still walk), *Fast travel* (explicit teleport) and *Open now* (a text alternative that skips walking).
- Progress and settings persist in `localStorage` (nothing else is stored); **Reset progress** is in Settings and Journal.

## Architecture

```
public/
  index.html  styles.css
  js/
    data.js      all content (single source of truth)
    main.js      bootstrap; falls back to Quick Portfolio if canvas fails
    game.js      Game: loop, movement, AABB-vs-grid collision, camera, NPCs, tokens, nav, intro cinematic
    nav.js       collision grid, trees/furniture, A* pathfinding
    art.js       procedural art: character sprite sheet (11 animation states x 4 directions), baked campus, buildings
    holo.js      animated mission stage with the talking character
    panels.js    the 10 mission interiors (lazy-loaded on first entry)
    ui.js        HUD, minimap, panel + narration controls, journal, directory, settings, touch
    quick.js     Quick Portfolio
    audio.js     Narrator (Web Speech + timed-caption fallback) and Web Audio SFX/music
    progress.js  Store (localStorage)
    util.js
server.mjs       dev server        tests/  run.mjs  e2e.py        vercel.json
```

Performance: the campus is baked once into an offscreen canvas; characters are pre-rendered sprite frames; mission interiors (`panels.js`, `holo.js`) load on first entry; there are no image or audio files to download, so first load is a few small text files. Render quality drops automatically if FPS falls below ~34 (Settings → Graphics quality overrides).

Accessibility: keyboard-operable UI with visible focus, native `<dialog>` focus handling, ARIA live announcements, captions on all narration, text-only mode, reduced-motion support (system setting or manual), a campus directory as a text alternative to walking, and a skip link to the Quick Portfolio. The Quick Portfolio works without the canvas.

## Differences from the original brief (read this)

- **Stack.** The brief recommended Next.js + Phaser 3 + Tailwind + GSAP + Framer Motion. The build environment blocked the npm registry, so nothing could be installed or built. With your approval I built a **dependency-free** version instead (vanilla ES modules + Canvas 2D) that I could run and test. The architecture follows the suggested module split; it is **not** TypeScript/Phaser/Tiled. Porting to that stack is possible, since all content and logic are separated from rendering.
- **Map.** There is no Tiled file; the map is a 64×44 tile grid defined in code (`nav.js`, `art.js`) with collision, walkability and A* navigation.
- **Campus accuracy.** The layout is an **original illustration**, not a survey of KTR. Only the entrance gate is presented as the campus entrance; every other building is labelled **"portfolio pavilion"**. The SRMIST brochure confirms the KTR campus exists on NH45 and mentions facilities such as a central library, but gives no map, so no building positions were copied. No SRM logos or photographs are used.
- **Character.** The cartoon is an original fictionalised avatar. The supplied photograph was **not** used and no likeness is claimed.
- **Voice.** Narration uses the visitor's **browser text-to-speech**, clearly labelled as a synthetic narrator, not Raghul's voice. If the browser has no voice or no Speech API, captions run on a timer and everything still works. Automated tests can confirm captions and fallback but cannot judge voice quality; please listen on your own devices. No recorded audio files are included.
- **Reference portfolio.** `jervis-olive.vercel.app` renders its content with JavaScript; only its hero text could be read, so no other content, startup description or links were taken from it.

## Content to confirm

- `public/documents/Raghul_S_Resume.pdf` is **not yet added**.
- **Tesseract Labs**: only the name was supplied. The pavilion says so honestly and claims no registration, revenue, team or clients. The longer name "Tesseract Labs of Innovation and AI Technology" from the brief was not used because it was not confirmed.
- No named projects, certificate images, credential URLs, dates, IDs or scores were supplied, so none are shown. Skills carry no proficiency ratings.
- The three achievements appear exactly as supplied, with no invented dates, teams or ranks.
- Deployment: **not done from this environment**; no live URL exists yet.

See [ASSETS.md](ASSETS.md) for asset licences.
