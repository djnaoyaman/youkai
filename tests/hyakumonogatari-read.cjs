const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');

const base = process.env.TEST_BASE || 'http://127.0.0.1:8523/';
const index = 'hyakumonogatari.html';
const first = 'kaidan/fumitsukai.html';
const last = 'kaidan/saigonotoushin.html';
const readButton = (page) => page.locator('.edo-read-button');
const header = (page) => page.locator('.edo-read-mark--header');
const listMark = (page, path) => page.locator(`.entry-row a[href="${path}"] .edo-read-mark`);
const saved = (page) => page.locator('.edo-read-notice');

(async () => {
  const engine = process.env.TEST_ENGINE === 'webkit' ? webkit : chromium;
  const executablePath = process.env.TEST_EXECUTABLE;
  const browser = await engine.launch(executablePath ? { executablePath } : {});
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 700 }, isMobile: true, hasTouch: true });
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort()
    );
    const list = await context.newPage();
    const story = await context.newPage();
    const go = (page, path) => page.goto(new URL(path, base).href, {waitUntil: 'domcontentloaded'});
    await go(list, index);
    assert.equal(await list.locator('.edo-read-mark').count(), 99);
    assert.equal(await list.locator('.edo-read-mark:visible').count(), 0);
    const links = await list.locator('.entry-row a[href^="kaidan/"]').evaluateAll((a) => a.map((e) => e.getAttribute('href')));
    assert.equal(new Set(links).size, 99);

    await go(story, first);
    assert.equal(await header(story).isVisible(), false);
    assert.equal(await readButton(story).textContent(), '読んだ');
    assert.equal(await story.locator('.record + .edo-read-control + .kaidan-prevnext').count(), 1);
    await readButton(story).press('Enter');
    assert.equal(await header(story).textContent(), '読了済み');
    assert.equal(await header(story).isVisible(), true);
    assert.equal(await saved(story).textContent(), '読了として記録しました。');
    assert.equal(await story.locator('.kaidan-alllist-row.is-current .edo-read-mark:visible').count(), 1);
    await listMark(list, first).waitFor({state: 'visible'});
    assert.equal(await listMark(list, last).isVisible(), false);
    assert.equal(await list.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await story.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    await story.close();
    const reopened = await context.newPage();
    await go(reopened, first + '?from=reopen#read');
    assert.equal(await header(reopened).isVisible(), true);
    assert.equal(await readButton(reopened).textContent(), '読了を取り消す');
    await go(reopened, last);
    assert.equal(await header(reopened).isVisible(), false);
    await readButton(reopened).tap();
    await listMark(list, last).waitFor({state: 'visible'});
    await go(reopened, first);
    await readButton(reopened).tap();
    await listMark(list, first).waitFor({state: 'hidden'});
    assert.equal(await listMark(list, last).isVisible(), true);
    await list.reload({waitUntil: 'domcontentloaded'});
    assert.equal(await listMark(list, first).isVisible(), false);
    assert.equal(await listMark(list, last).isVisible(), true);

    if (!process.env.TEST_BASE) {
      const results = await list.evaluate(async (paths) => {
        return Promise.all(paths.map(async (path) => {
          const response = await fetch(path);
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          return response.ok && doc.querySelectorAll('.record > .record-head').length === 1 &&
            doc.querySelectorAll('.record + .kaidan-prevnext').length === 1 &&
            doc.querySelectorAll('.kaidan-alllist-row.is-current').length === 1 &&
            doc.querySelectorAll('script[src="../script.js"]').length === 1;
        }));
      }, links);
      assert.equal(results.filter(Boolean).length, 99);
    }

    const fresh = await browser.newContext();
    await fresh.addInitScript(() => {
      Storage.prototype.setItem = function () { throw new Error('Storage unavailable'); };
    });
    const blocked = await fresh.newPage();
    await go(blocked, last);
    assert.equal(await header(blocked).isVisible(), false);
    await readButton(blocked).press('Space');
    assert.equal(await saved(blocked).textContent(), 'このブラウザでは読了の記録を保存できません。');
    assert.equal(await header(blocked).isVisible(), false);
    await go(blocked, 'kamakura-taxi-kaidan-01.html');
    assert.equal(await readButton(blocked).count(), 0);
    console.log('百物語: 99 entries, read/undo, reopen, independent stories/profile, storage blocked, scoped UI.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
