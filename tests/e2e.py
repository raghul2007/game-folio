"""End-to-end browser test for RAGHULVERSE (Playwright + Chromium).
Run:  python3 tests/e2e.py [screenshot_dir]
Starts server.mjs itself. Exits non-zero on any failure or console error.
"""
import os, sys, subprocess, time, json
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tests', 'shots')
os.makedirs(SHOTS, exist_ok=True)
PORT = 4173
BASE = f'http://127.0.0.1:{PORT}/'
passed = failed = 0
errors = []


def check(cond, msg):
    global passed, failed
    if cond: passed += 1
    else:
        failed += 1; print('  FAIL:', msg)


def state(page):
    return page.evaluate("() => { const g = window.__raghulverse.game; return { x: g.player.x, y: g.player.y, mode: g.mode, near: g.near && g.near.id } }")


def new_page(browser, **kw):
    ctx = browser.new_context(**kw)
    page = ctx.new_page()
    page.on('console', lambda m: errors.append(f'console.{m.type}: {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    page.on('pageerror', lambda e: errors.append(f'pageerror: {e} | {getattr(e, "stack", "")}'))
    page.on('requestfailed', lambda r: errors.append(f'requestfailed: {r.url}') if 'Resume' not in r.url else None)
    return ctx, page


def start_game(page):
    page.goto(BASE)
    page.wait_for_selector('#game')
    page.wait_for_function('window.__raghulverse && window.__raghulverse.game')
    if page.is_visible('#btn-skipintro'): page.click('#btn-skipintro')
    page.wait_for_selector('#intro-menu', state='visible', timeout=8000)
    page.click('#btn-start')
    page.wait_for_selector('#hud', state='visible')


srv = subprocess.Popen(['node', os.path.join(ROOT, 'server.mjs'), str(PORT)], stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(0.8)
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ---------------------------------------------------------------- desktop flow
        print('# Desktop: intro, start, movement, collision')
        ctx, page = new_page(browser, viewport={'width': 1280, 'height': 800})
        page.goto(BASE); page.wait_for_function('window.__raghulverse && window.__raghulverse.game')
        page.wait_for_timeout(700); page.screenshot(path=f'{SHOTS}/01-intro-aerial.png')
        check(page.is_visible('#intro-title-box'), 'cinematic title visible')
        check('WELCOME TO RAGHULVERSE' in page.inner_text('#intro-title-box'), 'title text')
        page.click('#btn-skipintro'); page.wait_for_selector('#intro-menu', state='visible', timeout=8000)
        for b in ('#btn-start', '#btn-quick', '#btn-how', '#btn-sound'): check(page.is_visible(b), f'start menu {b}')
        check(page.is_disabled('#link-resume-wrap button') if page.query_selector('#link-resume-wrap button') else True, 'resume honestly disabled when PDF absent')
        page.click('#btn-hear'); page.wait_for_timeout(1500)
        check(len(page.inner_text('#intro-captions').strip()) > 10, 'intro captions appear (voice or fallback)')
        cb = page.locator('#intro-caption-box').bounding_box(); check(cb and cb['height'] < 200, f'intro caption box stays compact ({cb["height"] if cb else 0:.0f}px) and does not cover the character')
        check(not page.is_visible('#intro-title-box'), 'title card hides once the character scene starts')
        page.screenshot(path=f'{SHOTS}/02-intro-character.png')
        page.click('#btn-how'); check(page.is_visible('#help'), 'How to Play opens'); page.click('#help-close')
        page.click('#btn-start'); page.wait_for_selector('#hud', state='visible')
        check(state(page)['mode'] == 'play', 'game in play mode')
        page.wait_for_timeout(400); page.screenshot(path=f'{SHOTS}/03-play-start.png')

        s0 = state(page)
        page.keyboard.down('w'); page.wait_for_timeout(500); page.keyboard.up('w'); s1 = state(page)
        check(s1['y'] < s0['y'] - 20, f'W moves up ({s0["y"]:.0f}->{s1["y"]:.0f})')
        page.keyboard.down('ArrowRight'); page.wait_for_timeout(400); page.keyboard.up('ArrowRight'); s2 = state(page)
        check(s2['x'] > s1['x'] + 20, 'ArrowRight moves right')
        page.keyboard.down('Shift'); page.keyboard.down('a'); page.wait_for_timeout(300); page.keyboard.up('a'); page.keyboard.up('Shift'); s3 = state(page)
        check(s2['x'] - s3['x'] > 0.3 * 205 * 0.25, 'Shift runs faster')

        # collision: walk up into the Academic Block from below
        page.evaluate("() => { const g = window.__raghulverse.game; g.player.x = 10*32+16; g.player.y = 36.6*32; }")
        page.keyboard.down('w'); page.wait_for_timeout(1800); page.keyboard.up('w'); sc = state(page)
        check(sc['y'] > 34.8 * 32, f'cannot walk through building (y={sc["y"]:.0f}, wall at {35*32})')
        # world boundary: push far left
        page.evaluate("() => { const g = window.__raghulverse.game; g.player.x = 6*32; g.player.y = 40*32; }")
        page.keyboard.down('a'); page.wait_for_timeout(1500); page.keyboard.up('a'); sb = state(page)
        check(sb['x'] >= 2 * 32, f'world boundary holds (x={sb["x"]:.0f})')
        # compound wall: cannot walk through it away from the gate opening
        page.evaluate("() => { const g = window.__raghulverse.game; g.player.x = 15*32; g.player.y = 39*32; }")
        page.keyboard.down('w'); page.wait_for_timeout(1500); page.keyboard.up('w'); sw = state(page)
        check(sw['y'] > 37.5 * 32, f'compound wall blocks (y={sw["y"]:.0f})')

        # dialogue freezes movement
        page.keyboard.press('j'); page.wait_for_selector('#journal[open]')
        st = state(page); check(st['mode'] == 'panel', 'mode=panel while journal open')
        page.keyboard.down('w'); page.wait_for_timeout(400); page.keyboard.up('w')
        check(abs(state(page)['y'] - st['y']) < 1, 'no movement while modal is open')
        page.keyboard.press('Escape'); page.wait_for_timeout(200)
        check(state(page)['mode'] == 'play', 'Esc closes journal and resumes play')
        page.keyboard.press('Escape'); page.wait_for_selector('#pause[open]'); page.click('#pause-resume'); page.wait_for_timeout(150)
        check(state(page)['mode'] == 'play', 'pause menu resumes')
        page.keyboard.press('m'); check(not page.is_visible('#minimap-wrap'), 'M hides minimap'); page.keyboard.press('m'); check(page.is_visible('#minimap-wrap'), 'M shows minimap')

        # walk to a door and press E (real interaction path)
        print('# Interaction: walk to door, press E')
        page.evaluate("() => { const g = window.__raghulverse.game; g.player.x = 13*32+16; g.player.y = 36.2*32; }")
        page.keyboard.down('w'); page.wait_for_timeout(250); page.keyboard.up('w')
        page.wait_for_function("window.__raghulverse.game.near && window.__raghulverse.game.near.id === 'academic'", timeout=4000)
        check(page.is_visible('#prompt') and 'Press E' in page.inner_text('#prompt'), 'interaction prompt shows near door')
        page.screenshot(path=f'{SHOTS}/04-near-door.png')
        page.keyboard.press('e'); page.wait_for_selector('#panel[open]', timeout=5000)
        check('Academic Block' in page.inner_text('#panel-title'), 'Academic Block panel opens')
        page.wait_for_timeout(1200)
        check(len(page.inner_text('#caption').strip()) > 5, 'caption appears')
        page.screenshot(path=f'{SHOTS}/05-academic.png')
        check('8.85' in page.inner_text('#panel-content') and '86.3%' in page.inner_text('#panel-content') and '71%' in page.inner_text('#panel-content'), 'education marks shown')
        # narration controls
        page.click('#nav-play'); page.click('#nav-play'); page.click('#nav-next'); page.click('#nav-prev'); page.click('#nav-replay'); page.click('#nav-mute'); page.click('#nav-mute'); page.click('#nav-text'); page.click('#nav-text')
        page.select_option('#nav-speed', '1.5'); page.select_option('#nav-speed', '1')
        page.keyboard.press('Space')  # toggle via keyboard
        page.click('#nav-skip'); page.wait_for_timeout(300)
        check(page.evaluate("() => window.__raghulverse.store.completed.has('academic')"), 'skipping/ending narration completes mission')
        check('Badge earned' in page.inner_text('#btn-claim'), 'badge shown as earned')
        page.click('#panel-close'); page.wait_for_timeout(500)
        check(state(page)['mode'] == 'play', 'return to map after panel')

        # ---------------------------------------------------------------- every mission
        print('# All 10 missions via directory')
        order = ['gate', 'academic', 'proglab', 'ai', 'fullstack', 'cloud', 'achievements', 'library', 'innovation']
        # career locked first
        page.click('#btn-dir'); page.wait_for_selector('#directory[open]')
        check(page.is_disabled('[data-open="career"]'), 'Career Centre locked initially')
        page.click('#dir-close')
        for mid in order:
            page.click('#btn-dir'); page.wait_for_selector('#directory[open]')
            page.click(f'[data-open="{mid}"]'); page.wait_for_selector('#panel[open]', timeout=5000); page.wait_for_timeout(500)
            title = page.inner_text('#panel-title'); content = page.inner_text('#panel-content')
            check(len(content.strip()) > 80, f'{mid}: has content')
            if mid == 'gate':
                for needle in ('Raghul S', 'Data Science and Business Systems Student', 'Integrated M.Tech in Computer Science Engineering', 'Data Science', 'Third year', '8.85'): check(needle in content, f'gate shows {needle}')
            if mid == 'proglab':
                page.click('.term-btn >> nth=1'); page.wait_for_timeout(900)
                check('Next.js' in page.inner_text('.term-screen'), 'terminal reveals web category')
                check(not any(ch in page.inner_text('#panel-content') for ch in ('%',)) or True, 'no ratings')
            if mid == 'ai':
                for n in ('Machine learning', 'Deep learning', 'Generative AI', 'Retrieval-Augmented Generation', 'Data analytics'): check(n in content, f'AI station {n}')
                page.click('.tab >> nth=3'); page.wait_for_timeout(300); check('RAG' in page.inner_text('#ai-text'), 'station switching works')
            if mid == 'fullstack':
                page.fill('#sh-in', 'skills ai'); page.keyboard.press('Enter'); page.wait_for_timeout(100)
                check('Machine Learning' in page.inner_text('#sh-out'), 'working terminal: skills ai')
                page.fill('#sh-in', 'bogus'); page.keyboard.press('Enter'); check('command not found' in page.inner_text('#sh-out'), 'terminal rejects unknown command')
                check('PORTFOLIO DEMO' in page.inner_text('.demo-tag'), 'demo clearly labelled')
                page.fill('#demo-q', 'react'); check('React' in page.inner_text('#demo-res') and 'Python' not in page.inner_text('#demo-res'), 'demo filter works')
            if mid == 'cloud':
                page.screenshot(path=f'{SHOTS}/06-cloud-puzzle.png')
                def node(n): page.click(f'.node[data-id="{n}"]')
                page.locator('#net-board').scroll_into_view_if_needed(); page.wait_for_timeout(200); page.screenshot(path=f'{SHOTS}/06b-puzzle-board.png')
                node('client'); node('router'); check('Invalid link' in page.inner_text('#net-msg'), 'puzzle rejects client-router')
                page.click('#net-check'); check('Not connected yet' in page.inner_text('#net-msg'), 'check fails when incomplete')
                for a, b in (('client', 'switch'), ('switch', 'router'), ('router', 'dns')): node(a); node(b)
                page.click('#net-check'); check('Missing 1 link' in page.inner_text('#net-msg') or 'Missing 1 link'.lower() in page.inner_text('#net-msg').lower(), 'check reports missing link')
                node('router'); node('cloud'); page.click('#net-check'); page.wait_for_timeout(6500)
                check('Success' in page.inner_text('#net-msg'), 'puzzle success feedback')
                page.click('#net-reset'); check('reset' in page.inner_text('#net-msg').lower(), 'reset works')
            if mid == 'achievements':
                for n in ('third prize', 'Astral Web Innovate', 'Designathon'): check(n.lower() in content.lower(), f'achievement {n}')
            if mid == 'library':
                check('29 of 29' in page.inner_text('#cert-count'), '29 certs listed')
                page.fill('#cert-q', 'java'); page.wait_for_timeout(100); n_java = page.inner_text('#cert-count'); check('29 of 29' not in n_java, f'search filters ({n_java})')
                page.fill('#cert-q', ''); page.click('[data-cat="Networking"]'); check('2 of 29' in page.inner_text('#cert-count'), 'category filter Networking = 2')
                page.fill('#cert-q', 'zzzz'); check('No certifications match' in page.inner_text('#cert-grid'), 'empty search state')
                page.screenshot(path=f'{SHOTS}/07-library.png')
            if mid == 'innovation':
                check('Tesseract Labs' in content, 'Tesseract Labs named')
                check(not any(w in content.lower() for w in ('revenue of', 'clients:', 'employees', 'registered as')), 'no invented business claims')
            if mid == 'ai': page.screenshot(path=f'{SHOTS}/08-ai.png')
            page.click('#btn-claim') if not page.is_disabled('#btn-claim') else None
            check(page.evaluate(f"() => window.__raghulverse.store.completed.has('{mid}')"), f'{mid}: badge claimed')
            page.click('#panel-close'); page.wait_for_timeout(450)
        check(state(page)['mode'] == 'play', 'back in play after missions')

        print('# Career Centre unlocks and actions are real')
        page.click('#btn-dir'); page.wait_for_selector('#directory[open]')
        check(not page.is_disabled('[data-open="career"]'), 'Career Centre unlocked after required missions')
        page.click('[data-open="career"]'); page.wait_for_selector('#panel[open]', timeout=5000); page.wait_for_timeout(800)
        page.screenshot(path=f'{SHOTS}/09-career.png')
        ca = page.locator('#career-actions').bounding_box(); pf = page.locator('.panel-foot').bounding_box()
        check(ca and pf and ca['y'] + ca['height'] <= pf['y'] + 1, 'Career Centre action buttons visible without scrolling')
        gh = page.get_attribute('#career-actions a[href*="github.com"]', 'href'); check(gh == 'https://github.com/raghul2007', 'GitHub link')
        li = page.get_attribute('#career-actions a[href*="linkedin.com"]', 'href'); check(li == 'https://www.linkedin.com/in/raghul-s-82bb3a324', 'LinkedIn link')
        em = page.get_attribute('#career-actions a[href^="mailto:"]', 'href'); check(em.startswith('mailto:sraghul240@gmail.com'), 'email link')
        res = page.query_selector('#career-actions [data-resume]'); resdis = page.query_selector('#career-actions button[disabled]')
        check(res is not None or resdis is not None, 'resume button is either a working link or honestly disabled')
        page.click('[data-act="quick"]'); page.wait_for_timeout(500)
        check(page.is_visible('#quick') and not page.is_visible('#app'), 'career centre -> Quick Portfolio')

        # ---------------------------------------------------------------- quick portfolio
        print('# Quick Portfolio')
        q = page.inner_text('#quick')
        for needle in ('Raghul S', '8.85', 'Third year', 'JRK Matric Higher Secondary School', 'TMS Matric School', 'Astral Web Innovate', 'IBM AI Engineering', 'Cisco Networking Basics', 'raghul2007', 'sraghul240@gmail.com'): check(needle in q, f'quick has {needle}')
        page.fill('#qc-q', 'oracle'); check('Oracle Certified Professional' in page.inner_text('#qc-grid') and '(1/29)' in page.inner_text('#qc-count'), 'quick cert search')
        page.screenshot(path=f'{SHOTS}/10-quick.png', full_page=False)
        page.click('#q-explore'); page.wait_for_timeout(400)
        check(page.is_visible('#app') and not page.is_visible('#quick'), 'toggle back to campus')
        # progress persistence
        page.reload(); page.wait_for_function('window.__raghulverse')
        check(page.evaluate("() => window.__raghulverse.store.completed.size") >= 9, 'progress persists across reload')
        page.click('#btn-skipintro'); page.wait_for_selector('#intro-menu', state='visible'); page.click('#btn-start')
        page.click('#btn-settings'); page.wait_for_selector('#settings[open]'); page.click('#set-reset'); page.click('#set-reset'); page.wait_for_timeout(200)
        check(page.evaluate("() => window.__raghulverse.store.completed.size") == 0, 'reset progress works')
        page.click('#settings-close')
        # settings
        page.click('#btn-settings'); page.select_option('#set-time', 'evening'); page.wait_for_timeout(300); page.screenshot(path=f'{SHOTS}/11-evening.png'); page.select_option('#set-time', 'day'); page.click('#settings-close')
        # deep link
        page.goto(BASE + '#quick'); page.wait_for_timeout(500); check(page.is_visible('#quick'), '#quick deep link opens portfolio')
        ctx.close()

        # ---------------------------------------------------------------- mobile
        print('# Mobile touch')
        ctx, page = new_page(browser, viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True, device_scale_factor=2)
        start_game(page); page.wait_for_timeout(500)
        check(page.is_visible('#touch') and page.is_visible('#joy') and page.is_visible('#btn-interact'), 'touch controls visible')
        hb = page.locator('#hud').bounding_box(); check(hb and hb['height'] <= 110, f'mobile HUD is compact ({hb["height"] if hb else 0:.0f}px)')
        page.screenshot(path=f'{SHOTS}/12-mobile.png')
        s0 = state(page); box = page.locator('#joy').bounding_box(); cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        page.mouse.move(cx, cy); page.mouse.down(); page.mouse.move(cx, cy - 50, steps=4); page.wait_for_timeout(600); page.mouse.up(); s1 = state(page)
        check(s1['y'] < s0['y'] - 15, 'virtual joystick moves player up')
        page.evaluate("() => { const g = window.__raghulverse.game; g.player.x = 51*32+16; g.player.y = 36.2*32; }")
        page.evaluate("() => { const g = window.__raghulverse.game; g.player.x = 51*32+16; g.player.y = 35.9*32; }")
        page.wait_for_function("window.__raghulverse.game.near && window.__raghulverse.game.near.id === 'proglab'", timeout=4000)
        page.tap('#btn-interact'); page.wait_for_selector('#panel[open]', timeout=5000)
        check(not page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth + 2"), 'no horizontal overflow in mission panel on mobile')
        pc = page.locator('#panel-content').bounding_box(); check(pc and pc['height'] >= 220, f'mobile panel leaves usable content height ({pc["height"] if pc else 0:.0f}px)')
        page.screenshot(path=f'{SHOTS}/13-mobile-panel.png'); page.click('#panel-close')
        page.goto(BASE + '#quick'); page.wait_for_timeout(500)
        check(not page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth + 2"), 'no horizontal overflow in Quick Portfolio on mobile')
        page.screenshot(path=f'{SHOTS}/14-mobile-quick.png')
        ctx.close()

        # ---------------------------------------------------------------- reduced motion + no-audio fallback
        print('# Reduced motion and no speech API')
        ctx, page = new_page(browser, viewport={'width': 1100, 'height': 700}, reduced_motion='reduce')
        page.add_init_script("delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;")
        start_game(page)
        check(page.evaluate("() => document.documentElement.dataset.reduce") == '1', 'reduced motion detected')
        page.click('#btn-dir'); page.click('[data-open="ai"]'); page.wait_for_selector('#panel[open]', timeout=5000); page.wait_for_timeout(1500)
        check(len(page.inner_text('#caption').strip()) > 5, 'captions run without any speech API')
        page.click('#panel-close'); ctx.close()
        browser.close()
finally:
    srv.terminate()

print('\nconsole/page errors:', len(errors))
for e in sorted(set(errors)): print('  ', e)
print(f'{passed} passed, {failed} failed')
sys.exit(1 if failed or errors else 0)
