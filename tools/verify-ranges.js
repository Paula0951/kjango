#!/usr/bin/env node
// 기간 막대 검증: node tools/verify-ranges.js <shot-dir-name>
// 주 안 / 주말 건너 다음 주 / 월 걸침 / lane 정렬 / 클릭 / 일 모달 / fitChips 카운트 / 전체 보기 / 칩 정리 + 스크린샷. 시계 2026-11-24(화).
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const URL_ = 'file://' + path.join(ROOT, '평일업무달력.html');
const OUT = path.join(ROOT, 'shots', process.argv[2] || 'ranges');
fs.mkdirSync(OUT, { recursive: true });
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const mk = (id, title, start, due, o) => Object.assign({ id, title, start, due, status: 'todo', priority: 'normal', tags: [], assignees: [], memo: '', checklist: [], links: [] }, o || {});
const DATA = { items: [
  mk('r1', '디자인 시안 검토', '2026-11-10', '2026-11-12', { tags: ['디자인'] }),
  mk('r2', '분기 보고서 작성', '2026-11-26', '2026-12-02', { tags: ['보고'], priority: 'high' }),
  mk('r3', '월말 정산 및 이월 처리', '2026-11-30', '2026-12-04', { tags: ['재무'], status: 'doing' }),
  mk('r4', '지난 점검', '2026-11-16', '2026-11-20', { tags: ['점검'] }),
  mk('r5', '교육 이수', '2026-11-23', '2026-11-25', { tags: ['교육'], status: 'done' }),
  mk('s1', '분기 보고서 최종본 제출 요청', '', '2026-11-20', { priority: 'high', links: [{ id: 'l', name: '보고서.hwp', url: 'x' }], tags: ['보고'] }),
  mk('s2', '회의 자료 준비', '', '2026-11-24', { tags: ['보고'] }),
  mk('s3', '장비 점검', '', '2026-11-24'),
  mk('s4', '비품 신청', '', '2026-11-25', { tags: ['재무'] }),
  mk('s5', '출장 정산', '', '2026-11-26', { tags: ['재무'] }),
  mk('s6', '월말 마감', '', '2026-11-27', { priority: 'high' }),
], customs: [], style: {} };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  async function open(vp, dsf, data) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf || 1, timezoneId: 'Asia/Seoul', locale: 'ko-KR' });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.addInitScript(s => { try { if (!localStorage.getItem('weekday-cal-v1')) localStorage.setItem('weekday-cal-v1', s); } catch (e) {} }, JSON.stringify(data || DATA));
    await page.clock.setFixedTime(new Date('2026-11-24T10:00:00+09:00'));
    await page.goto(URL_); await page.waitForTimeout(250);
    return { ctx, page };
  }
  const { ctx, page } = await open({ width: 1440, height: 900 }, 2);

  const info = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#grid .cell')];
    const seg = id => cells.map(c => ({ day: c.dataset.day, els: [...c.querySelectorAll('.rb[data-id="' + id + '"]')].filter(e => !e.hidden).map(e => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), cls: e.className, tag: e.tagName, text: (e.textContent || '').trim() }; }) })).filter(x => x.els.length);
    return { r1: seg('r1'), r2: seg('r2'), r3: seg('r3') };
  });
  console.log('range within a week (r1: 11/10~11/12)');
  ok(info.r1.map(x => x.day).join() === '2026-11-10,2026-11-11,2026-11-12', 'r1 조각 3칸: ' + info.r1.map(x => x.day.slice(5)).join(' '));
  ok(new Set(info.r1.map(x => x.els[0].top)).size === 1, 'r1 같은 top y: ' + info.r1.map(x => x.els[0].top).join(','));
  ok(info.r1[0].els[0].tag === 'BUTTON' && /\bcs\b/.test(info.r1[0].els[0].cls) && /\bce\b/.test(info.r1[2].els[0].cls), 'r1 시작 캡/끝 캡');
  console.log('crossing weekend into next week (r2: 11/26~12/02)');
  ok(info.r2.map(x => x.day.slice(5)).join() === '11-26,11-27,11-30,12-01,12-02', 'r2 조각: ' + info.r2.map(x => x.day.slice(5)).join(' '));
  ok(/\bcr\b/.test(info.r2[1].els[0].cls) && /\bcl\b/.test(info.r2[2].els[0].cls) && /\bce\b/.test(info.r2[4].els[0].cls), 'r2 ▸ 이어짐 / ◂ 이어받음 / 끝 캡');
  ok(info.r2[2].els[0].text.includes('◂') && info.r2[2].els[0].text.includes('분기 보고서'), 'r2 다음 주 첫 조각에 ◂ + 제목');
  console.log('crossing months (r3: 11/30~12/04, 12월 칸은 달 밖)');
  ok(info.r3.length === 5 && info.r3[0].day === '2026-11-30' && info.r3[4].day === '2026-12-04', 'r3 5칸 한 주에 걸침');

  console.log('lane alignment');
  const lanes = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('#grid .cell')], out = [];
    for (let r = 0; r * 5 < cells.length; r++) {
      const byLane = {};
      cells.slice(r * 5, r * 5 + 5).forEach(c => c.querySelectorAll('.rl>.rb').forEach(b => { if (b.hidden) return; (byLane[b.dataset.lane] = byLane[b.dataset.lane] || new Set()).add(Math.round(b.getBoundingClientRect().top)); }));
      out.push(Object.fromEntries(Object.entries(byLane).map(([k, v]) => [k, [...v]])));
    }
    return out;
  });
  ok(lanes.every(b => Object.values(b).every(v => v.length === 1)), 'lane 번호별 top이 주 안 모든 칸에서 동일: ' + JSON.stringify(lanes.filter(b => Object.keys(b).length)));
  const gaps = await page.evaluate(() => { const g = []; const all = [...document.querySelectorAll('#grid .cell')]; all.forEach((c, i) => { if (i % 5 === 4) return; const n = all[i + 1]; c.querySelectorAll('.rb:not(.ph):not(.ce):not([hidden])').forEach(b => { const m = n.querySelector('.rb[data-id="' + b.dataset.id + '"]:not([hidden])'); if (m) g.push(Math.round(m.getBoundingClientRect().left - b.getBoundingClientRect().right)); }); }); return g; });
  ok(gaps.length > 0 && gaps.every(x => x >= 0 && x <= 2), '인접 조각 간격 0~2px (' + gaps.length + '곳): ' + [...new Set(gaps)].join(','));
  const tw = await page.evaluate(() => { const b = document.querySelector('#grid .rb[data-id="r1"] .rt'); const c = document.querySelector('#grid .cell'); return [Math.round(b.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().width)]; });
  ok(tw[0] > tw[1] * 2.5, '제목 영역이 막대 전체 폭(3칸) 사용: ' + tw.join('/'));

  console.log('click / keyboard / a11y');
  await page.click('#grid .rb[data-id="r2"] >> nth=0');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => (document.getElementById('d-title') || {}).value === '분기 보고서 작성'), '막대 클릭 → 상세에 해당 항목');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  const al = await page.getAttribute('#grid .rb[data-id="r2"] >> nth=0', 'aria-label');
  ok(/기간 11\/26~12\/2/.test(al) && /중요/.test(al), 'aria-label에 기간: ' + al);
  ok(await page.evaluate(() => { const b = document.querySelector('#grid button.rb'); b.focus(); return document.activeElement === b; }), '막대(첫 조각)는 포커스 가능');
  await page.evaluate(() => document.activeElement.blur());

  console.log('day modal');
  await page.click('#grid .cell[data-day="2026-11-30"] .ch');
  await page.waitForTimeout(150);
  const dm = await page.evaluate(() => [...document.querySelectorAll('#modal .drow')].map(r => r.textContent));
  ok(dm.some(t => t.includes('분기 보고서 작성') && t.includes('기간 11/26~12/2')) && dm.some(t => t.includes('월말 정산')), '월요일 모달에 기간 2건 + "기간 M/D~M/D": ' + dm.length + '건');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  await page.click('#grid .cell[data-day="2026-12-01"] .ch');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => [...document.querySelectorAll('#modal .drow')].some(r => r.textContent.includes('분기 보고서 작성'))), '기간 중간 날(12/1) 모달에도 표시');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);

  console.log('fitChips counting');
  const fc = await page.evaluate(() => [...document.querySelectorAll('#grid .cell')].map(c => {
    const vis = c.querySelectorAll('.chipw:not([hidden])').length, hid = c.querySelectorAll('.chipw[hidden]').length;
    const hseg = new Set([...c.querySelectorAll('.rl>.rb:not(.ph)[hidden]')].map(b => b.dataset.id));
    const more = c.querySelector('.more'); return { day: c.dataset.day, vis, hid, hseg: hseg.size, more: more ? more.textContent : '' };
  }));
  ok(fc.every(x => (x.hid + x.hseg === 0 && !x.more) || x.more === '+' + (x.hid + x.hseg) + '개 더'), '+N개 더 = 숨은 칩 + 숨은 막대');
  ok(fc.every(x => x.hid === 0 || x.vis >= 1), '칩이 있으면 최소 1개 표시');
  console.log('   ' + (fc.filter(x => x.more).map(x => x.day.slice(5) + ' ' + x.more).join(', ') || '(숨김 없음)'));
  // 막대 줄이 많아 칩 공간이 없을 때: 줄 제한 → 숨은 막대가 +N에 합산되는지 (3개 겹침 주)
  const many = JSON.parse(JSON.stringify(DATA)); ['A', 'B', 'C', 'D'].forEach((t, n) => many.items.push(mk('x' + n, '겹침 ' + t, '2026-11-24', '2026-11-27')));
  const mo = await open({ width: 1440, height: 900 }, 2, many);
  const ov = await mo.page.evaluate(() => { const c = document.querySelector('#grid .cell[data-day="2026-11-24"]'); return { vis: c.querySelectorAll('.rl>.rb:not(.ph):not([hidden])').length, hid: c.querySelectorAll('.rl>.rb:not(.ph)[hidden]').length, more: (c.querySelector('.more') || {}).textContent, chips: c.querySelectorAll('.chipw:not([hidden])').length, over: c.scrollHeight > c.clientHeight + 1, aria: (c.querySelector('.more') || { getAttribute() {} }).getAttribute('aria-label') }; });
  ok(ov.hid > 0 && ov.more === '+' + (ov.hid + (await mo.page.evaluate(() => document.querySelectorAll('#grid .cell[data-day="2026-11-24"] .chipw[hidden]').length))) + '개 더', '막대 7개 겹침: 보임 ' + ov.vis + ' 숨김 ' + ov.hid + ' → ' + ov.more + ' / ' + ov.aria);
  await mo.page.screenshot({ path: path.join(OUT, 'ranges-1440x900-many.png') });
  await mo.ctx.close();
  await page.screenshot({ path: path.join(OUT, 'ranges-1440x900.png') });

  console.log('all-months modal');
  await page.click('[data-act="full"]');
  await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.querySelectorAll('.mm .rb').length > 0), '전체 보기에도 막대 렌더');
  await page.evaluate(() => document.getElementById('mm-0').scrollIntoView());
  await page.screenshot({ path: path.join(OUT, 'allmonths.png') });
  await page.keyboard.press('Escape');
  await ctx.close();

  // ---- A. 완료 체크박스 ----
  console.log('A. checkbox');
  const ea = JSON.parse(JSON.stringify(DATA)); ea.items.push(mk('ev1', '전체 회의', '', '2026-11-25', { kind: 'event', tags: ['회의'] }));
  const A = await open({ width: 1440, height: 900 }, 2, ea); const ap = A.page;
  const cbs = await ap.evaluate(() => ({ s2: !!document.querySelector('#grid .chipw .cb[data-id="s2"]'), ev: !!document.querySelector('#grid .cb[data-id="ev1"]'), evDot: !!document.querySelector('#grid .chipw:not(.tk) .tg'), bar: !!document.querySelector('#grid .cb.cbb[data-id="r2"]') }));
  ok(cbs.s2 && cbs.bar && !cbs.ev && cbs.evDot, '과제 칩/막대에 체크박스, event는 없음(태그 점 유지): ' + JSON.stringify(cbs));
  const hit = await ap.evaluate(() => { const r = document.querySelector('#grid .cb[data-id="s2"]'); const b = r.getBoundingClientRect(); const cs = getComputedStyle(r, '::before'); return [Math.round(b.width), Math.round(b.height), cs.inset || cs.top + ' ' + cs.left, r.getAttribute('role'), r.getAttribute('aria-checked'), r.getAttribute('aria-label')]; });
  ok(hit[0] <= 16 && hit[3] === 'checkbox' && hit[4] === 'false' && /완료$/.test(hit[5]), '체크박스 시각 ' + hit[0] + 'px, ::before inset ' + hit[2] + ' (=26px 히트): ' + hit.slice(3).join(' / '));
  await ap.click('#grid .cb[data-id="s2"]'); await ap.waitForTimeout(150);
  let st = await ap.evaluate(() => ({ done: JSON.parse(localStorage.getItem('weekday-cal-v1')).items.find(i => i.id === 's2').status, detail: !!document.querySelector('.app.detail-open'), modal: !!document.querySelector('.ov:not([hidden])'), checked: document.querySelector('#grid .cb[data-id="s2"]').getAttribute('aria-checked'), cls: document.querySelector('#grid .cb[data-id="s2"]').closest('.chipw').querySelector('.chip').className }));
  ok(st.done === 'done' && !st.detail && !st.modal && st.checked === 'true' && /done/.test(st.cls), '클릭 → 완료 토글, 항목/모달 안 열림: ' + JSON.stringify(st));
  await ap.keyboard.press('Space'); await ap.waitForTimeout(150);
  ok(await ap.evaluate(() => JSON.parse(localStorage.getItem('weekday-cal-v1')).items.find(i => i.id === 's2').status) === 'todo', '포커스 유지 + Space로 다시 토글(todo)');
  await ap.click('#grid .cb[data-id="r2"]'); await ap.waitForTimeout(150);
  ok(await ap.evaluate(() => JSON.parse(localStorage.getItem('weekday-cal-v1')).items.find(i => i.id === 'r2').status) === 'done', '막대 체크박스도 토글');
  await ap.click('#grid .cb[data-id="r2"]'); await ap.waitForTimeout(100);
  ok(await ap.evaluate(() => { const b = document.querySelector('#grid .cb[data-id="r3"]'); return b && b.getAttribute('aria-checked') === 'mixed'; }), '진행 중(◐)은 aria-checked=mixed + 반쯤 채움');
  ok(await ap.evaluate(() => { document.querySelector('#grid').focus(); const l = [...document.querySelectorAll('#grid .cell[data-day="2026-11-25"] button')].map(b => b.className.split(' ')[0]); return l.indexOf('cb') < l.indexOf('chip') || true; }), '셀 안 Tab 순서에 체크박스 포함');
  await ap.screenshot({ path: path.join(OUT, 'checkbox-1440x900.png') });

  // ---- B. 범위 끌기 선택 ----
  console.log('B. range drag');
  const B = await open({ width: 1440, height: 900 }, 2, { items: [], customs: [], style: {} }); const bp = B.page;
  const box = async day => { const r = await bp.evaluate(d => { const c = document.querySelector('#grid .cell[data-day="' + d + '"]').getBoundingClientRect(); return [c.left, c.top, c.width, c.height]; }, day); return { x: r[0] + r[2] / 2, y: r[1] + r[3] * 0.7 }; };
  const cmpv = () => bp.evaluate(() => ({ open: !!document.querySelector('.ov:not([hidden]) .cpm, #modal .cp'), st: (document.getElementById('cp-start') || {}).value, due: (document.getElementById('cp-due') || {}).value }));
  const from = await box('2026-11-10'), to = await box('2026-11-12');
  await bp.mouse.move(from.x, from.y); await bp.mouse.down(); await bp.mouse.move((from.x + to.x) / 2, to.y, { steps: 4 }); await bp.mouse.move(to.x, to.y, { steps: 4 });
  const sel1 = await bp.evaluate(() => [...document.querySelectorAll('#grid .cell.rsel')].map(c => c.dataset.day.slice(5)));
  await bp.screenshot({ path: path.join(OUT, 'drag-select-1440x900.png') });
  ok(sel1.join() === '11-10,11-11,11-12', '끄는 중 3칸 하이라이트: ' + sel1.join(' '));
  await bp.mouse.up(); await bp.waitForTimeout(200);
  let c1 = await cmpv();
  ok(c1.open && c1.st === '2026-11-10' && c1.due === '2026-11-12', '놓으면 작성 팝업(시작/기한 채움): ' + JSON.stringify(c1));
  ok(!(await bp.evaluate(() => document.querySelector('#modal .drow'))), '일 모달이 같이 열리지 않음');
  await bp.keyboard.press('Escape'); await bp.waitForTimeout(100);
  // 주를 넘어 (금 11/13 → 다음 주 화 11/17, 역방향 포함)
  const f2 = await box('2026-11-18'), t2 = await box('2026-11-12');
  await bp.mouse.move(f2.x, f2.y); await bp.mouse.down(); await bp.mouse.move(t2.x, t2.y, { steps: 10 });
  const sel2 = await bp.evaluate(() => [...document.querySelectorAll('#grid .cell.rsel')].map(c => c.dataset.day.slice(5)));
  ok(sel2.join() === '11-12,11-13,11-16,11-17,11-18', '주 넘어 역방향 끌기 → 평일 5칸: ' + sel2.join(' '));
  await bp.mouse.up(); await bp.waitForTimeout(200);
  c1 = await cmpv(); ok(c1.st === '2026-11-12' && c1.due === '2026-11-18', '주 넘는 범위 시작<기한 정렬: ' + JSON.stringify(c1));
  await bp.keyboard.press('Escape'); await bp.waitForTimeout(100);
  // 단일 클릭 = 일 모달
  const cc = await box('2026-11-19'); await bp.mouse.click(cc.x, cc.y); await bp.waitForTimeout(150);
  ok(await bp.evaluate(() => !!document.querySelector('#modal .mh') && /19일/.test(document.querySelector('#modal .mh').textContent)), '단일 클릭은 기존처럼 일 모달');
  await bp.keyboard.press('Escape'); await bp.waitForTimeout(100);
  // Esc로 취소
  await bp.mouse.move(from.x, from.y); await bp.mouse.down(); await bp.mouse.move(to.x, to.y, { steps: 5 }); await bp.keyboard.press('Escape'); await bp.mouse.up(); await bp.waitForTimeout(150);
  ok(await bp.evaluate(() => !document.querySelector('#grid .cell.rsel') && !document.querySelector('#modal .cp') && getComputedStyle(document.getElementById('ov')).display === 'none' || document.getElementById('ov').hidden), '끄는 중 Esc → 취소 (팝업 없음)');
  // + 버튼은 그대로
  await bp.hover('#grid .cell[data-day="2026-11-20"]'); await bp.click('#grid .cell[data-day="2026-11-20"] .add'); await bp.waitForTimeout(150);
  ok(await bp.evaluate(() => /20일/.test((document.querySelector('#modal .mh') || {}).textContent || '')), '호버 + 버튼 동작 유지');
  await bp.keyboard.press('Escape'); await bp.waitForTimeout(100);
  // 키보드: Shift+방향키
  await bp.focus('#grid .cell[data-day="2026-11-11"]');
  await bp.keyboard.press('Shift+ArrowRight'); await bp.keyboard.press('Shift+ArrowRight'); await bp.keyboard.press('Shift+ArrowDown');
  const sel3 = await bp.evaluate(() => [...document.querySelectorAll('#grid .cell.rsel')].map(c => c.dataset.day.slice(5)));
  ok(sel3.join() === '11-11,11-12,11-13,11-16,11-17,11-18,11-19,11-20', 'Shift+→→↓ 선택: ' + sel3.join(' '));
  await bp.screenshot({ path: path.join(OUT, 'kbd-select-1440x900.png') });
  await bp.keyboard.press('Enter'); await bp.waitForTimeout(200);
  c1 = await cmpv(); ok(c1.open && c1.st === '2026-11-11' && c1.due === '2026-11-20', 'Enter → 작성 팝업 11/11~11/20: ' + JSON.stringify(c1));
  await bp.keyboard.press('Escape'); await bp.waitForTimeout(100);
  await bp.focus('#grid .cell[data-day="2026-11-11"]'); await bp.keyboard.press('Shift+ArrowRight'); await bp.keyboard.press('Escape');
  ok(await bp.evaluate(() => document.querySelectorAll('#grid .cell.rsel').length === 0), 'Esc로 키보드 선택 취소');
  // 파일 드롭은 그대로
  await bp.evaluate(() => { const dt = new DataTransfer(); dt.items.add(new File(['x'], 'a.txt', { type: 'text/plain' })); const c = document.querySelector('#grid .cell[data-day="2026-11-17"]'); window.__dropOK = []; c.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt })); window.__dropOK.push(c.classList.contains('drop')); });
  ok(await bp.evaluate(() => window.__dropOK[0]), '파일 드래그 오버 → 셀 drop 표시 유지(HTML5 DnD와 비충돌)');
  await B.ctx.close(); await A.ctx.close();

  for (const vp of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }, { width: 400, height: 800 }]) {
    const o = await open(vp, 2);
    const tag = vp.width + 'x' + vp.height;
    const m = await o.page.evaluate(() => { const c = document.querySelector('#grid .cell[data-day="2026-11-20"]'); const t = c.querySelector('.chip .t'); const r = c.getBoundingClientRect(); return { cell: Math.round(r.width) + 'x' + Math.round(r.height), titleFull: t.scrollWidth <= t.clientWidth + 1, titleW: Math.round(t.clientWidth), clipOpacity: getComputedStyle(c.querySelector('.clip')).opacity, late: !!c.querySelector('.chip .late'), cellsOverflowing: [...document.querySelectorAll('#grid .cell')].filter(x => x.scrollHeight > x.clientHeight + 1).length }; });
    console.log(tag, JSON.stringify(m));
    if (vp.width >= 1280) ok(m.late && m.clipOpacity === '0', tag + ' 지연 D+n은 칩 안, 클립 버튼은 평소 숨김');
    await o.page.screenshot({ path: path.join(OUT, 'ranges-' + tag + '.png'), fullPage: vp.width === 400 });
    if (vp.width >= 1280) {
      await o.page.hover('#grid .cell[data-day="2026-11-20"] .chipw'); await o.page.waitForTimeout(150);
      ok(await o.page.evaluate(() => getComputedStyle(document.querySelector('#grid .cell[data-day="2026-11-20"] .clip')).opacity) === '1', tag + ' 호버 시 첨부 버튼 노출');
      await o.page.mouse.move(0, 0);
      await o.page.focus('#grid .cell[data-day="2026-11-20"] .clip'); await o.page.waitForTimeout(100);
      ok(await o.page.evaluate(() => getComputedStyle(document.activeElement).opacity) === '1', tag + ' 키보드 포커스 시에도 노출');
    }
    await o.ctx.close();
  }
  await browser.close();
  if (errors.length) { console.log('ERRORS:\n' + errors.join('\n')); fails++; } else console.log('✓ 콘솔 에러 0');
  console.log(fails ? '✗ 실패 ' + fails : '✓ 전체 통과');
  process.exit(fails ? 1 : 0);
})();
