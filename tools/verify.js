#!/usr/bin/env node
// 검증 스크립트: node tools/verify.js <shot-dir-name>
// 1) <script> 문법 검사  2) 1440×900 / 1280×720 / 400×800 스크린샷 + 콘솔 에러 수집
// 3) 키보드 흐름(칸 이동 → Enter → 모달 Tab 순환 → Esc → 포커스 복귀)  4) 구버전 localStorage 주입
// 네트워크는 차단(오프라인), 시계는 2026-11-13 10:00(Asia/Seoul)로 고정.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, '평일업무달력.html');
const name = process.argv[2] || 'adhoc';
const OUT = path.join(ROOT, 'shots', name);
fs.mkdirSync(OUT, { recursive: true });

// 1) syntax
const src = fs.readFileSync(HTML, 'utf8');
const m = src.match(/<script>([\s\S]*?)<\/script>/);
const tmp = path.join(require('os').tmpdir(), 'cal-script-check.js');
fs.writeFileSync(tmp, m[1]);
execFileSync(process.execPath, ['--check', tmp], { stdio: 'inherit' });
console.log('✓ node --check');

const URL_ = 'file://' + HTML;
const CLOCK = new Date('2026-11-13T10:00:00+09:00');
const LEGACY = JSON.stringify({
  items: [
    { id: 'a1', title: '구버전 항목', due: '2026-11-12', status: 'todo', priority: 'high' },
    { id: 'a2', title: '필드 누락', due: '2026-11-16' },
    { id: 'a3', title: '완료', due: '2026-11-10', status: 'done', tags: ['보고'] },
    null, { id: 'bad' },
  ],
  customs: [{ id: 'c', date: '2026-11-20', name: '휴가', color: '#7c4dff', off: true }],
  style: { fontSize: 13 }, wp: { bg: '#1f2a36' },
});

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  async function newPage(vp, storage) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, timezoneId: 'Asia/Seoul', locale: 'ko-KR' });
    await ctx.setOffline(true);
    await ctx.route(/^(?!file:)/, r => r.abort());
    const page = await ctx.newPage();
    await page.clock.install({ time: CLOCK });
    page.on('console', msg => { if (msg.type() === 'error') errors.push(`[${vp.width}] console: ${msg.text()}`); });
    page.on('pageerror', e => errors.push(`[${vp.width}] pageerror: ${e.message}`));
    if (storage) await page.addInitScript(s => { try { localStorage.setItem('weekday-cal-v1', s); } catch (e) {} }, storage);
    await page.goto(URL_);
    await page.waitForTimeout(150);
    return { ctx, page };
  }

  // 2) screenshots
  for (const vp of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 400, height: 800 }]) {
    const { ctx, page } = await newPage(vp);
    const tag = vp.width + 'x' + vp.height;
    await page.screenshot({ path: path.join(OUT, `main-${tag}.png`) });
    const chip = page.locator('.cell.tnow .chip').first();
    if (await chip.count()) {
      await chip.click();
      await page.waitForTimeout(80);
      await page.screenshot({ path: path.join(OUT, `detail-${tag}.png`) });
    }
    await ctx.close();
  }
  console.log('✓ screenshots →', path.relative(ROOT, OUT));

  // 3) keyboard
  {
    const { ctx, page } = await newPage({ width: 1440, height: 900 });
    const act = () => page.evaluate(() => { const a = document.activeElement; return a ? (a.dataset.day || a.id || a.className || a.tagName) : null; });
    let found = false;
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement.classList.contains('cell'))) { found = true; break; }
    }
    if (!found) errors.push('keyboard: Tab으로 날짜 칸에 도달 못함');
    const start = await act();
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
    const back = await act();
    if (start !== back) errors.push(`keyboard: 화살표 왕복 후 포커스 불일치 ${start} → ${back}`);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(80);
    if (await page.locator('#ov').isHidden()) errors.push('keyboard: Enter로 일 모달 안 열림');
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press(i % 7 === 6 ? 'Shift+Tab' : 'Tab');
      const inside = await page.evaluate(() => document.getElementById('modal').contains(document.activeElement));
      if (!inside) { errors.push('keyboard: Tab이 모달 밖으로 나감'); break; }
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(50);
    const after = await act();
    if (after !== start) errors.push(`keyboard: Esc 후 포커스 ${after} (기대 ${start})`);
    console.log(`  keyboard: start=${start} after-esc=${after}`);
    await ctx.close();
  }

  // 4) legacy data
  {
    const { ctx, page } = await newPage({ width: 1440, height: 900 }, LEGACY);
    const n = await page.locator('#grid .chip').count();
    const fs_ = await page.evaluate(() => document.documentElement.style.getPropertyValue('--fs'));
    if (n < 2) errors.push('legacy: 구버전 항목이 렌더되지 않음 (' + n + ')');
    console.log(`  legacy: chips=${n} --fs=${fs_}`);
    await page.screenshot({ path: path.join(OUT, 'legacy-1440x900.png') });
    await ctx.close();
  }

  await browser.close();
  if (errors.length) { console.error('✗ ' + errors.length + ' error(s)\n' + errors.join('\n')); process.exit(1); }
  console.log('✓ 콘솔 에러 0, 키보드 흐름 OK, 구버전 데이터 OK');
})().catch(e => { console.error(e); process.exit(1); });
