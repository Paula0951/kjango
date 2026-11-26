#!/usr/bin/env node
// 모든 데이터 백업(v2) · 예전 업무/출석 백업 불러오기 · 원자적 쓰기 검증: node tools/verify-backup.js
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const URL_ = 'file://' + path.join(ROOT, '평일업무달력.html');
let fails = 0;
const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR', acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.clock.setFixedTime(new Date('2026-11-24T10:00:00+09:00'));
  const ST = () => page.evaluate(() => ({ w: localStorage.getItem('weekday-cal-v1'), a: localStorage.getItem('attend-cal-v1'), f: localStorage.getItem('fixed-sched-v1'), h: localStorage.getItem('hol-off-v1') }));
  const fresh = async q => { await page.goto(URL_); await page.evaluate(() => localStorage.clear()); await page.goto(URL_ + (q || '')); await page.waitForTimeout(250); };
  const buf = o => ({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)) });
  const wOpen = async () => { if (!(await page.$('#bk-in'))) { await page.click('[data-act=settings]'); await page.click('#tab-data'); } };
  const aOpen = async () => { await page.click('#att [data-a=open][data-m=data]'); await page.waitForSelector('#abk-in'); };
  const setIn = (id, v) => page.evaluate(([id, v]) => { document.getElementById(id).value = v; }, [id, v]);
  const pick = (pre, on) => page.evaluate(([pre, on]) => ['work', 'att', 'shared'].forEach(k => { const e = document.getElementById(pre + '-' + k); if (e && !e.disabled) e.checked = on.includes(k); }), [pre, on]);
  const state = () => page.evaluate(() => ({ items: KR_WORK.get().items.length, stu: KR_ATT.getA().students.length, fixed: KR_FIXED.length, off: [...KR_HOLOFF] }));
  const mkAtt = { tracks: [{ id: 't1', name: '직종A' }], students: [{ id: 's1', name: '김가', track: 't1', start: '2026-12-01', end: '2027-06-30' }, { id: 's2', name: '이나', track: 't1', start: '2026-12-01', end: '2027-06-30' }] };
  const mkWork = { items: [{ id: 'a1', title: '백업 일', due: '2026-11-25' }, { id: 'a2', title: '둘째', due: '2026-11-26' }], customs: [], disabledHol: [] };
  const fx = [{ id: 'fx-x', from: '2027-02-01', to: '2027-02-05', kind: 'closed', name: '시험 휴업', on: true }];
  const has = async sel => !!(await page.$(sel));

  console.log('v2 내보내기 · 업무 설정에서 왕복');
  await fresh();
  await wOpen();
  await page.setInputFiles('#bk-file', buf(mkWork));
  await page.click('[data-act=armimp]');
  ok(await has('#bk-c-work:not([disabled]):checked') && await has('#bk-c-att[disabled]') && await has('#bk-c-shared[disabled]'), '예전 업무 파일: 업무만 켜짐');
  await page.click('[data-act=imp]');
  ok((await state()).items === 2, '예전 업무 파일 불러오기: 항목 2');
  await page.evaluate(([a, fx]) => { KR_ATT.setA(a); KR_WORK.setShared(fx, ['2026-12-25']); }, [mkAtt, fx]);
  await wOpen();
  await page.evaluate(() => { const c = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { window.__dlName = this.download; return c.call(this); }; });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=bkfile]')]);
  const dn = await page.evaluate(() => window.__dlName);
  ok(/^달력-백업-\d{4}-\d{2}-\d{2}\.json$/.test(dn), '파일명 ' + dn);
  const txt = fs.readFileSync(await dl.path(), 'utf8'); const obj = JSON.parse(txt);
  ok(obj.format === 'mycal' && obj.v === 2 && obj.work.items.length === 2 && obj.att.students.length === 2 && obj.shared.fixed.length === 1 && obj.shared.holOff[0] === '2026-12-25' && !isNaN(Date.parse(obj.saved)), 'v2 구조');
  await fresh();
  await wOpen();
  await page.setInputFiles('#bk-file', buf(txt));
  await page.click('[data-act=armimp]');
  ok(await has('#bk-c-work:checked') && await has('#bk-c-att:checked') && await has('#bk-c-shared:checked'), 'v2 파일: 3개 모두 켜짐');
  await page.click('[data-act=imp]');
  let s = await state();
  ok(s.items === 2 && s.stu === 2 && s.fixed === 1 && s.off.join() === '2026-12-25', 'v2 업무 설정 왕복: ' + JSON.stringify(s));
  let st = await ST();
  ok(JSON.parse(st.w).items.length === 2 && JSON.parse(st.a).students.length === 2 && JSON.parse(st.f).length === 1 && JSON.parse(st.h)[0] === '2026-12-25', '저장소 4개 키 기록');
  ok(JSON.parse(st.w).disabledHol.join() === '2026-12-25' && JSON.parse(st.a).disabledHol.join() === '2026-12-25', '각 달력 disabledHol 동기화');

  console.log('v2 출석 모달에서 왕복');
  await fresh('?mode=att');
  await aOpen();
  await page.setInputFiles('#abk-file', buf(txt));
  await page.click('#amodal [data-a=arm][data-v=imp]');
  ok(await has('#abk-c-work:checked') && await has('#abk-c-att:checked'), '출석 모달 chooser');
  await page.click('#amodal [data-a=imp]');
  s = await state();
  ok(s.items === 2 && s.stu === 2 && s.fixed === 1 && s.off.join() === '2026-12-25', '출석 모달 왕복: ' + JSON.stringify(s));
  const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('#amodal [data-a=bk]')]);
  const o2 = JSON.parse(fs.readFileSync(await dl2.path(), 'utf8'));
  ok(o2.format === 'mycal' && o2.work.items.length === 2 && o2.att.students.length === 2, '출석 모달도 v2 내보내기');

  console.log('예전 출석 파일 (+ fixed, disabledHol)');
  await fresh('?mode=att');
  const wKeep = (await ST()).w;
  await aOpen();
  await page.setInputFiles('#abk-file', buf(Object.assign({}, mkAtt, { fixed: fx, disabledHol: ['2026-12-25', 'x', 5] })));
  await page.click('#amodal [data-a=arm][data-v=imp]');
  ok(await has('#abk-c-att:checked') && await has('#abk-c-work[disabled]') && await has('#abk-c-shared:checked'), '예전 출석: 출석+공통만');
  await page.click('#amodal [data-a=imp]');
  s = await state(); st = await ST();
  ok(s.stu === 2 && s.fixed === 1 && s.off.join() === '2026-12-25' && st.w === wKeep, '예전 출석 불러오기 · 업무 키 안 씀: ' + JSON.stringify(s));

  console.log('깨진 파일은 아무것도 쓰지 않음');
  await fresh();
  await wOpen();
  const before = await ST(), bs = await state();
  for (const bad of ['{not json', '[]', '{"format":"mycal","v":2,"work":{"items":"x"}}', '{"foo":1}', '{"format":"mycal","v":2}', '{"format":"mycal","v":2,"shared":{"fixed":5}}']) {
    await setIn('bk-in', bad);
    await page.click('[data-act=armimp]');
    const er = await page.textContent('#bk-err');
    ok(er.length > 0 && !(await has('#bk-c-work')), '거부: ' + bad.slice(0, 32) + ' → ' + er);
  }
  ok(JSON.stringify(await ST()) === JSON.stringify(before) && JSON.stringify(await state()) === JSON.stringify(bs), '저장소·메모리 그대로');
  await setIn('bk-in', ' '.repeat(8 * 1024 * 1024 + 5) + '{}');
  await page.click('[data-act=armimp]');
  ok((await page.textContent('#bk-err')).includes('너무 커요'), '8MB 초과 거부');

  console.log('공통 설정만 고르기');
  await fresh();
  await wOpen();
  await page.setInputFiles('#bk-file', buf(mkWork)); await page.click('[data-act=armimp]'); await page.click('[data-act=imp]');
  const wBefore = (await ST()).w;
  await setIn('bk-in', JSON.stringify({ format: 'mycal', v: 2, work: { items: [] }, att: mkAtt, shared: { fixed: fx, holOff: ['2026-12-24'] } }));
  await page.click('[data-act=armimp]');
  await pick('bk-c', ['shared']);
  await page.click('[data-act=imp]');
  s = await state(); st = await ST();
  ok(s.items === 2 && s.stu === 0 && s.fixed === 1 && s.off.join() === '2026-12-24' && st.w === wBefore && st.a === null, '공통만 적용, 업무 유지·출석 안 씀: ' + JSON.stringify(s));

  console.log('예전 업무 파일 disabledHol → 끈 공휴일');
  await fresh();
  await wOpen();
  await page.setInputFiles('#bk-file', buf(Object.assign({}, mkWork, { disabledHol: ['2026-12-25'], fixed: fx })));
  await page.click('[data-act=armimp]'); await page.click('[data-act=imp]');
  s = await state(); st = await ST();
  ok(s.off.join() === '2026-12-25' && s.fixed === 1 && JSON.parse(st.h).join() === '2026-12-25', '끈 공휴일 복원 · fixed 반영: ' + JSON.stringify(s));

  console.log('원자적 쓰기: setItem 실패 시 되돌림');
  await fresh();
  await wOpen();
  await page.setInputFiles('#bk-file', buf(mkWork)); await page.click('[data-act=armimp]'); await page.click('[data-act=imp]');
  const b4 = await ST(), s4 = await state();
  await page.evaluate(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (k === 'fixed-sched-v1') throw new Error('quota'); return o.call(this, k, v); }; window.__restore = () => { Storage.prototype.setItem = o; }; });
  await setIn('bk-in', JSON.stringify({ format: 'mycal', v: 2, work: { items: [{ id: 'z', title: 'Z', due: '2026-11-25' }] }, att: mkAtt, shared: { fixed: fx, holOff: ['2026-12-24'] } }));
  await page.click('[data-act=armimp]'); await page.click('[data-act=imp]');
  const er = await page.textContent('#bk-err');
  ok(er.length > 0, '오류 표시: ' + er);
  ok(JSON.stringify(await ST()) === JSON.stringify(b4) && JSON.stringify(await state()) === JSON.stringify(s4), '저장소·메모리 그대로');
  await page.evaluate(() => window.__restore());

  ok(errors.length === 0, '콘솔 오류 없음 ' + errors.join(' | '));
  await browser.close();
  console.log(fails ? '\n' + fails + ' FAIL' : '\nALL OK');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
