#!/usr/bin/env node
// 빠른 추가 검증: node tools/verify-quickadd.js <shot-dir-name>
// `/` 날짜 문법·토큰 하이라이트·파일 드롭 → 작성 팝업·Shift+Enter·Esc 포커스 복귀·콘솔 에러 0. 시계는 2026-11-24(화) 10:00 KST.
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const URL_ = 'file://' + path.join(ROOT, '평일업무달력.html');
const OUT = path.join(ROOT, 'shots', process.argv[2] || 'quickadd');
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, timezoneId: 'Asia/Seoul', locale: 'ko-KR' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.clock.setFixedTime(new Date('2026-11-24T10:00:00+09:00'));
  await page.goto(URL_);
  await page.waitForTimeout(200);
  const items = () => page.evaluate(() => JSON.parse(localStorage.getItem('weekday-cal-v1')).items);

  // 1) 파싱 (입력 → 힌트 칩 / 저장된 항목)
  console.log('parse');
  const hint = async t => { await page.fill('#qa', t); return page.evaluate(() => ({ txt: document.getElementById('qa-hint').textContent, err: document.getElementById('qa-hint').classList.contains('err'), chips: [...document.querySelectorAll('#qa-hint .hc')].map(x => x.textContent) })); };
  let h = await hint('/2026-12-03 보고 #보고 @김 !높음');
  ok(h.chips[0].startsWith('12/3(목)') && h.chips.includes('#보고') && h.chips.includes('@김') && h.chips.includes('중요도 높음'), '풀 날짜+칩: ' + h.chips.join(' | '));
  h = await hint('/12-03~12-25 범위'); ok(h.chips[0] === '12/3(목) ~ 12/25(금)', '범위 칩: ' + h.chips[0]);
  h = await hint('/11-30~12-02 범위'); ok(h.chips[0] === '11/30(월) ~ 12/2(수)', '월 걸치기: ' + h.chips[0]);
  h = await hint('/12-03~25 짧은 끝'); ok(h.chips[0] === '12/3(목) ~ 12/25(금)', '~25 형식: ' + h.chips[0]);
  h = await hint('/2026-12-20~2027-01-05 해넘이'); ok(h.chips[0].includes('~ 2027.1/5(화)') && h.chips[0].startsWith('12/21'), '해넘이 범위: ' + h.chips[0]);
  h = await hint('/12-20~11-30 거꾸로'); ok(h.err && /빨라요/.test(h.txt), '시작>끝 오류: ' + h.txt);
  h = await hint('/13-45 잘못'); ok(h.err && /맞지 않/.test(h.txt), '잘못된 날짜 오류: ' + h.txt);
  h = await hint('/12-05 토요일'); ok(/12\/4\(금\)/.test(h.txt) && /토 → 금/.test(h.txt), '주말 이동: ' + h.txt);
  h = await hint('/03-10 내년으로'); ok(h.chips[0] === '2027.3/10(수)', '범위 앞 날짜는 내년: ' + h.chips[0]);
  h = await hint('/11-12 올해인데 지난날'); ok(h.chips[0] === '11/12(목)', '11월은 올해: ' + h.chips[0]);
  h = await hint('11/30 이전형식'); ok(h.chips[0] === '11/30(월)', '기존 11/30: ' + h.chips[0]);
  h = await hint('12월 3일 이전형식'); ok(h.chips[0] === '12/3(목)', '기존 12월 3일: ' + h.chips[0]);
  h = await hint('내일 이전형식'); ok(h.chips[0] === '11/25(수)', '기존 내일: ' + h.chips[0]);
  h = await hint('/내일 새형식'); ok(h.chips[0] === '11/25(수)', '/내일: ' + h.chips[0]);
  h = await hint('#보'); ok(await page.evaluate(() => document.querySelectorAll('#qa-hint .sg').length >= 0), '#제안 렌더 오류 없음');

  // 저장: 범위 항목
  await page.fill('#qa', '/12-03~12-25 연말 정산 #재무 @나 !높음'); await page.press('#qa', 'Enter');
  let it = (await items()).find(i => i.title === '연말 정산');
  ok(it && it.start === '2026-12-03' && it.due === '2026-12-25' && it.priority === 'high' && it.tags[0] === '재무' && Array.isArray(it.links), '범위 저장: ' + JSON.stringify(it && { s: it.start, d: it.due }));
  await page.fill('#qa', '/12-26 토요일 제출'); await page.press('#qa', 'Enter');
  it = (await items()).find(i => i.title === '토요일 제출'); ok(it && it.due === '2026-12-25', '토요일 → 금: ' + (it && it.due));
  await page.fill('#qa', '/12-20~11-30 거꾸로'); await page.press('#qa', 'Enter');
  ok(!(await items()).some(i => i.title === '거꾸로') && /빨라요/.test(await page.textContent('#qa-hint')), '오류 시 저장 안 됨');
  await page.fill('#qa', '');

  // 2) 토큰 하이라이트
  console.log('highlight');
  await page.fill('#qa', '주간보고 /12-03 #보고 @김과장 !높음 그리고 !낮음');
  const tk = await page.evaluate(() => [...document.querySelectorAll('#qa-mir .tk')].map(x => x.className + ':' + x.textContent));
  ok(tk.length === 5 && tk[0].includes(' d') && tk[1].includes(' t') && tk[2].includes(' w') && tk[3].includes('p h') && tk[4].includes('p l'), '미러 토큰: ' + tk.join(' | '));
  const geo = await page.evaluate(() => { const i = document.getElementById('qa'), m = document.getElementById('qa-mir'), a = i.getBoundingClientRect(), b = m.getBoundingClientRect(), si = getComputedStyle(i), sm = getComputedStyle(m);
    return { dx: a.left - b.left, dy: a.top - b.top, w: a.width - b.width, fs: si.fontSize === sm.fontSize, ff: si.fontFamily === sm.fontFamily, pl: si.paddingLeft === sm.paddingLeft, color: si.color }; });
  ok(geo.dx === 0 && geo.dy === 0 && geo.w === 0 && geo.fs && geo.ff && geo.pl, '미러와 input 박스·글꼴 일치 ' + JSON.stringify(geo));
  // 캐럿 정렬: 토큰 span 폭 == 같은 문자열의 input 텍스트 폭 (가로 패딩 없음)
  const wdiff = await page.evaluate(() => { const m = document.getElementById('qa-mir'); const s = m.querySelector('.tk.t'); const r = document.createElement('span'); r.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:' + getComputedStyle(m).font; r.textContent = s.textContent; document.body.appendChild(r); const d = Math.abs(r.getBoundingClientRect().width - s.getBoundingClientRect().width); r.remove(); return d; });
  ok(wdiff < 0.5, '토큰 폭 오차 ' + wdiff.toFixed(2) + 'px');
  await page.focus('#qa');
  await page.screenshot({ path: path.join(OUT, 'bar-highlight.png'), clip: { x: 0, y: 760, width: 1440, height: 140 } });
  await page.fill('#qa', '/12-03~12-25 연말 정산 #재','');
  await page.fill('#qa', '/12-03~12-25 연말 정산 #재');
  await page.screenshot({ path: path.join(OUT, 'bar-suggest.png'), clip: { x: 0, y: 760, width: 1440, height: 140 } });
  await page.fill('#qa', '');

  // 3) 파일 드롭 → 작성 팝업
  console.log('drop');
  const dropFiles = async (sel, names) => {
    const dt = await page.evaluateHandle(ns => { const d = new DataTransfer(); ns.forEach(n => d.items.add(new File(['x'], n))); return d; }, names);
    await page.dispatchEvent(sel, 'dragover', { dataTransfer: dt });
    await page.dispatchEvent(sel, 'drop', { dataTransfer: dt });
  };
  const dt1 = await page.evaluateHandle(() => { const d = new DataTransfer(); d.items.add(new File(['x'], '회의자료.hwp')); return d; });
  await page.dispatchEvent('.qa-box', 'dragover', { dataTransfer: dt1 });
  ok(await page.evaluate(() => document.querySelector('.qa').classList.contains('drop')), '드래그 중 .qa.drop (여기에 놓기)');
  await page.screenshot({ path: path.join(OUT, 'bar-drop.png'), clip: { x: 0, y: 740, width: 1440, height: 160 } });
  await page.dispatchEvent('.qa-box', 'drop', { dataTransfer: dt1 });
  await page.waitForSelector('#cp-title');
  const cp = await page.evaluate(() => ({ title: document.getElementById('cp-title').value, due: document.getElementById('cp-due').value, links: [...document.querySelectorAll('#cp-links .lk-n')].map(x => x.textContent), modal: document.getElementById('app').inert, focus: document.activeElement.id, sel: document.getElementById('cp-title').selectionEnd - document.getElementById('cp-title').selectionStart }));
  ok(cp.title === '회의자료' && cp.links[0] === '회의자료.hwp' && cp.due === '2026-12-01' && cp.modal && cp.focus === 'cp-title' && cp.sel === 4, '프리필/포커스: ' + JSON.stringify(cp));
  const before = (await items()).length;
  // 폼 조작: 태그 칩 + 담당 + 중요도 + 날짜 범위
  await page.fill('#cp-start', '2026-11-25'); await page.fill('#cp-due', '2026-12-04');
  await page.fill('#cp-tags-i', '회의'); await page.press('#cp-tags-i', 'Enter');
  await page.fill('#cp-tags-i', '보고,'); await page.press('#cp-tags-i', ',');
  await page.fill('#cp-who-i', '김과장'); await page.press('#cp-who-i', 'Enter');
  await page.click('#cp-pr [data-v=high]');
  await page.fill('#cp-memo', '사전 배포');
  await page.fill('#cp-lk-i', 'C:\\문서\\부록.xlsx'); await page.press('#cp-lk-i', 'Enter');
  const mid = await page.evaluate(() => ({ chips: [...document.querySelectorAll('#cp-tags-c .hc')].map(x => x.textContent.trim()), who: [...document.querySelectorAll('#cp-who-c .hc')].map(x => x.textContent.trim()), lk: document.querySelectorAll('#cp-links .lk').length, sug: document.querySelectorAll('#cp-tags-s .sg').length }));
  ok(mid.chips.join() === '#회의,#보고' && mid.who.join() === '@나,@김과장' && mid.lk === 2, '칩 추가: ' + JSON.stringify(mid));
  await page.screenshot({ path: path.join(OUT, 'composer.png') });
  // 링크 제거 → 다시 확인
  await page.click('#cp-links .lk:nth-child(2) [data-act=cplkx]');
  ok(await page.locator('#cp-links .lk').count() === 1, '링크 제거');
  await page.focus('#cp-title');
  await page.keyboard.press('Control+Enter');
  await page.waitForTimeout(100);
  const after = await items();
  const ni = after.find(i => i.title === '회의자료');
  ok(after.length === before + 1 && ni && ni.start === '2026-11-25' && ni.due === '2026-12-04' && ni.priority === 'high' && ni.tags.join() === '회의,보고' && ni.assignees.join() === '나,김과장' && ni.memo === '사전 배포' && ni.links.length === 1 && ni.links[0].name === '회의자료.hwp', '저장 항목: ' + JSON.stringify(ni && { s: ni.start, d: ni.due, p: ni.priority, t: ni.tags, w: ni.assignees, l: ni.links.map(l => l.name) }));
  ok(await page.evaluate(() => document.getElementById('ov').hidden && !document.getElementById('app').inert), '저장 후 모달 닫힘');
  ok(await page.evaluate(() => document.activeElement.id) === 'qa', '저장 후 포커스 → #qa: ' + await page.evaluate(() => document.activeElement.id));

  // 4) Shift+Enter → 자세히
  console.log('shift+enter');
  await page.fill('#qa', '/12-08 분기 점검 #점검 @박 !낮음');
  await page.focus('#qa'); await page.keyboard.press('Shift+Enter');
  await page.waitForSelector('#cp-title');
  const sf = await page.evaluate(() => ({ t: document.getElementById('cp-title').value, d: document.getElementById('cp-due').value, tags: [...document.querySelectorAll('#cp-tags-c .hc')].map(x => x.textContent.trim()), who: [...document.querySelectorAll('#cp-who-c .hc')].map(x => x.textContent.trim()), pr: document.querySelector('#cp-pr .on').dataset.v }));
  ok(sf.t === '분기 점검' && sf.d === '2026-12-08' && sf.tags.join() === '#점검' && sf.who.join() === '@박' && sf.pr === 'low', 'Shift+Enter 프리필: ' + JSON.stringify(sf));
  // 포커스 트랩: Tab 여러 번 모달 밖으로 안 나감
  let out = false;
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (!await page.evaluate(() => document.getElementById('modal').contains(document.activeElement))) out = true; }
  ok(!out, 'Tab 포커스 트랩');
  for (let i = 0; i < 40; i++) { await page.keyboard.press('Shift+Tab'); if (!await page.evaluate(() => document.getElementById('modal').contains(document.activeElement))) out = true; }
  ok(!out, 'Shift+Tab 포커스 트랩');
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.getElementById('ov').hidden && document.activeElement.id === 'qa' && document.getElementById('qa').value.includes('분기 점검')), 'Esc 취소: 닫힘+포커스 #qa+입력 유지');
  // 확장 버튼
  await page.click('[data-act=expand]');
  ok(await page.evaluate(() => !document.getElementById('ov').hidden && document.getElementById('cp-title').value === '분기 점검'), '확장 버튼으로 열림');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  ok((await items()).some(i => i.title === '분기 점검' && i.priority === 'low') && await page.inputValue('#qa') === '', 'Enter 저장 + 바 비움');
  // 빈 제목 오류
  await page.click('[data-act=expand]'); await page.fill('#cp-title', ''); await page.keyboard.press('Enter');
  ok(/제목/.test(await page.textContent('#cp-err')) && !await page.evaluate(() => document.getElementById('ov').hidden), '빈 제목 오류');
  await page.keyboard.press('Escape');

  // 5) 여러 파일 → 한 항목 / 파일별로
  console.log('multi');
  await dropFiles('.qa-box', ['a.hwp', 'b.pdf']);
  await page.waitForSelector('#cp-title');
  ok(await page.inputValue('#cp-title') === 'a 외 1개' && await page.locator('#cp-links .lk').count() === 2 && await page.isVisible('#cp-split'), '두 파일 → 링크 2개 + 파일별로 버튼');
  const n0 = (await items()).length;
  await page.click('#cp-split'); await page.waitForTimeout(100);
  const a2 = await items();
  ok(a2.length === n0 + 2 && a2.some(i => i.title === 'a' && i.links.length === 1) && a2.some(i => i.title === 'b'), '파일별로 → 항목 2개');
  await dropFiles('.qa-box', ['c.hwp', 'd.pdf']); await page.waitForSelector('#cp-title');
  await page.click('[data-act=cpsave]'); await page.waitForTimeout(100);
  ok((await items()).some(i => i.title === 'c 외 1개' && i.links.length === 2), '추가 → 항목 1개 링크 2개');
  // 팝업에도 파일 드롭
  await page.click('[data-act=expand]'); await dropFiles('#modal', ['e.hwp']); await page.waitForTimeout(150);
  ok(await page.locator('#cp-links .lk').count() === 1, '팝업에 파일 드롭');
  await page.keyboard.press('Escape');

  // 6) 날짜 토큰 버튼 + 일 모달 + 상세 start
  console.log('misc');
  await page.click('[data-act=insd]'); const v1 = await page.inputValue('#qa'); await page.click('[data-act=insd]'); const v2 = await page.inputValue('#qa');
  ok(v1 === '/11-25' && v2 === '/11-26', '날짜 버튼: ' + v1 + ' → ' + v2);
  await page.fill('#qa', '');
  await page.click('.cell[data-day="2026-12-08"]', { position: { x: 12, y: 12 } });
  await page.waitForSelector('#day-add');
  await page.fill('#day-add', '다른날 /12-10~12-11 #x @y !높음');
  const dmir = await page.evaluate(() => [...document.querySelectorAll('#modal .mir .tk')].length);
  ok(dmir === 4 && (await page.textContent('#day-err')).includes('12/10'), '일 모달 하이라이트+힌트 ' + dmir);
  await page.screenshot({ path: path.join(OUT, 'daymodal.png') });
  await page.press('#day-add', 'Enter'); await page.waitForTimeout(100);
  ok((await items()).some(i => i.title === '다른날' && i.start === '2026-12-10' && i.due === '2026-12-11'), '일 모달 범위 저장');
  await page.keyboard.press('Escape');
  await page.click('.rb:has-text("연말 정산") >> nth=0'); await page.waitForSelector('#d-start');
  ok(await page.inputValue('#d-start') === '2026-12-03' && /12\/3/.test(await page.textContent('#d-meta')), '상세에 시작일 표시: ' + await page.textContent('#d-meta'));
  await page.fill('#d-start', '2026-12-30');
  ok(/늦어요/.test(await page.textContent('#d-warn')), '상세 start>due 경고');

  ok(errors.length === 0, '콘솔 에러 ' + errors.length + (errors.length ? ' ' + errors.join(' / ') : ''));
  await browser.close();
  console.log(fails ? '\nFAIL ' + fails : '\nOK');
  process.exit(fails ? 1 : 0);
})();
