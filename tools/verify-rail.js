#!/usr/bin/env node
// 레일 연도 달 고르기 · 내비 · 오늘 표시 · 분류 색 배정 회귀 테스트: node tools/verify-rail.js  (모든 줄 PASS, ERRORS [] 이면 통과)
// 시계 2026-11-26 10:00 (Asia/Seoul). 두 달력(업무 #app / 출석 #att) 모두 확인
'use strict';
const { chromium } = require('playwright'); const path = require('path');
const URL_ = 'file://' + path.join(path.resolve(__dirname, '..'), '평일업무달력.html');
let n = 0; const id = () => 'r' + (++n);
const mk = (title, due, o) => Object.assign({ id: id(), title, start: '', due, status: 'todo', priority: 'normal', tags: [], assignees: [], memo: '', checklist: [], links: [] }, o || {});
const TAGS = ['회의', '보고', '행정', '교육', '예산', '점검', '출장', '기타'];
const DATA = { items: TAGS.map((t, i) => mk(t + ' 항목', '2026-11-' + String(2 + i).padStart(2, '0'), { tags: [t] })).concat([mk('끝난 일', '2027-02-03', { status: 'done' }), mk('남은 일', '2027-03-03')]), customs: [], style: {} };
let fails = 0; const ok = (name, c) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name); };

(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Seoul', locale: 'ko-KR' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('weekday-cal-v1', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(DATA));
  await p.clock.setFixedTime(new Date('2026-11-26T10:00:00+09:00'));
  await p.goto(URL_); await p.waitForTimeout(300);

  const st = (root) => p.evaluate(r => { const el = document.querySelector(r); const cur = el.querySelector('.mp-m[aria-current]');
    return { yr: el.querySelector('.mp-y').textContent, cur: cur ? cur.textContent : null, en: [...el.querySelectorAll('.mp-m:not(:disabled)')].map(x => x.textContent).join(','),
      tab0: el.querySelectorAll('.mp-g [tabindex="0"]').length, prevDis: el.querySelector('.mp-s[data-mp="-1"]').disabled, nextDis: el.querySelector('.mp-s[data-mp="1"]').disabled,
      now: [...el.querySelectorAll('.mp-m.now')].map(x => x.textContent).join(','), dots: [...el.querySelectorAll('.mp-m.dot')].map(x => x.textContent).join(','),
      title: document.querySelector(r.startsWith('#a') ? '#a-mtitle' : '#mtitle').textContent, focus: document.activeElement && document.activeElement.textContent }; }, root);
  const A = '#rail-months';

  // ---- 업무 달력 ----
  let s = await st(A);
  ok('업무: 처음 = 2026 · 11월 선택 · 이번 달 표시 ' + JSON.stringify(s), s.yr === '2026' && s.cur === '11월' && s.title === 'NOVEMBER' && s.now === '11월' && s.en === '11월,12월' && s.prevDis && !s.nextDis && s.tab0 === 1);
  ok('업무: 옛 달 목록(.mrow) 없음', await p.locator('.mrow').count() === 0);
  ok('업무: 점 = 남은 마감 있는 달 (' + s.dots + ')', s.dots === '11월');
  await p.click(A + ' .mp-m:has-text("12월")'); s = await st(A);
  ok('업무: 12월 누르기 → DECEMBER', s.title === 'DECEMBER' && s.cur === '12월');
  await p.click('[data-act=next]'); s = await st(A);
  ok('업무: 다음 달 → 2027 · 1월, 연도도 따라감 ' + s.yr, s.title === 'JANUARY' && s.yr === '2027' && s.cur === '1월' && s.en.split(',').length === 12);
  ok('업무: 2027 점 = 3월만 (끝난 일 제외)', s.dots === '3월');
  await p.click(A + ' .mp-s[data-mp="-1"]'); s = await st(A);
  ok('업무: ‹ 연도만 2026, 보이는 달은 그대로', s.yr === '2026' && s.title === 'JANUARY' && s.cur === null);
  await p.click(A + ' .mp-m:has-text("11월")'); s = await st(A);
  ok('업무: 2026 11월 → NOVEMBER', s.title === 'NOVEMBER' && s.yr === '2026');
  await p.click(A + ' .mp-s[data-mp="1"]'); await p.click(A + ' .mp-s[data-mp="1"]'); s = await st(A);
  ok('업무: 2028 = 1월만, › 막힘 ' + JSON.stringify(s.en), s.yr === '2028' && s.en === '1월' && s.nextDis && !s.prevDis);
  await p.click(A + ' .mp-m:has-text("1월")'); await p.click('[data-act=next]'); s = await st(A);
  ok('업무: 2028-01 에서 다음 → 범위 끝 유지', s.title === 'JANUARY' && s.yr === '2028' && await p.locator('#toast').isVisible());
  await p.click('[data-act=today]'); s = await st(A);
  ok('업무: 오늘 → 2026 · 11월', s.title === 'NOVEMBER' && s.yr === '2026' && s.cur === '11월');
  // 키보드: Tab 한 번에 들어가 화살표로 이동, Enter 로 열기
  await p.focus(A + ' .mp-g [tabindex="0"]'); s = await st(A); ok('업무: 로빙 포커스 시작 = 11월', s.focus === '11월');
  await p.keyboard.press('ArrowRight'); s = await st(A); ok('업무: → = 12월 포커스 (아직 안 열림)', s.focus === '12월' && s.title === 'NOVEMBER' && s.tab0 === 1);
  await p.keyboard.press('ArrowRight'); s = await st(A); ok('업무: → 끝에서 다음 해 1월로 ' + s.yr, s.yr === '2027' && s.focus === '1월');
  await p.keyboard.press('ArrowDown'); s = await st(A); ok('업무: ↓ = 5월', s.focus === '5월');
  await p.keyboard.press('Enter'); s = await st(A); ok('업무: Enter → MAY, 포커스 유지', s.title === 'MAY' && s.cur === '5월' && s.focus === '5월');
  await p.keyboard.press('ArrowUp'); await p.keyboard.press(' '); s = await st(A); ok('업무: ↑ + Space → JANUARY', s.title === 'JANUARY');
  await p.keyboard.press('ArrowLeft'); s = await st(A); ok('업무: ← 처음에서 앞 해 12월로', s.yr === '2026' && s.focus === '12월');
  await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); s = await st(A); ok('업무: 범위 밖 달(10월)로는 못 감', s.focus === '11월');
  await p.keyboard.press('Tab'); s = await st(A); ok('업무: Tab 한 번에 그리드 밖으로', !(await p.evaluate(a => document.querySelector(a).contains(document.activeElement), A)));
  await p.click('[data-act=today]');
  // 오늘 표시: 한 가지 신호
  const t = await p.evaluate(() => { const c = document.querySelector('#grid .cell[data-day="2026-11-26"]'), cs = getComputedStyle(c), d = getComputedStyle(c.querySelector('.dnum'));
    return { lab: document.querySelectorAll('.lab.tdy').length, outline: cs.outlineStyle, bs: cs.boxShadow, dcol: d.color, dbr: d.borderTopStyle, dow: getComputedStyle(document.querySelector('.dow span.now')).textDecorationLine }; });
  ok('오늘: TODAY 글자·틀 없음, 위 막대 + 숫자 색 ' + JSON.stringify(t), t.lab === 0 && t.outline === 'none' && /142, 187, 216/.test(t.bs) && t.dcol === 'rgb(142, 187, 216)' && t.dbr === 'none' && t.dow === 'none');
  // 구조 점선 = 그리드 바깥 테두리뿐
  const dash = await p.evaluate(() => { const o = {}; for (const e of document.querySelectorAll('#app *')) { const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue; const s = getComputedStyle(e);
    for (const sd of ['Top', 'Right', 'Bottom', 'Left']) if (s['border' + sd + 'Style'] === 'dashed' && parseFloat(s['border' + sd + 'Width']) > 0) o[e.id || e.className] = 1; if (s.outlineStyle === 'dashed' && parseFloat(s.outlineWidth) > 0) o['outline:' + (e.id || e.className)] = 1; } return Object.keys(o); });
  ok('점선: 쉬는 화면엔 그리드 테두리만 ' + JSON.stringify(dash), dash.length === 1 && dash[0] === 'grid');
  // 필터 켜짐 상태: 면 + --now 막대 (점선 밑줄 없음)
  await p.click('#nav-filter'); const nf = await p.evaluate(() => { const e = document.getElementById('nav-filter'), s = getComputedStyle(e); return { td: s.textDecorationLine, bg: s.backgroundColor, bar: getComputedStyle(e, '::before').backgroundColor }; });
  ok('필터 켜짐: 면 + 막대 ' + JSON.stringify(nf), nf.td === 'none' && nf.bg !== 'rgba(0, 0, 0, 0)' && nf.bar === 'rgb(142, 187, 216)'); await p.click('#nav-filter');

  // ---- 분류 색: 고르게, 다시 열어도 같게, 직접 고른 색이 먼저 ----
  const tc = () => p.evaluate(() => JSON.parse(localStorage.getItem('weekday-cal-v1')));
  let S = await tc(); const counts = [0, 0, 0, 0]; TAGS.forEach(t => counts[S.tagAuto[t]]++);
  ok('분류 색: 8개 → 4색 2개씩 ' + JSON.stringify(S.tagAuto), counts.every(c => c === 2) && S.tagAuto['회의'] !== S.tagAuto['보고']);
  const chipCols = await p.evaluate(() => [...new Set([...document.querySelectorAll('#grid .chipw')].map(e => e.style.getPropertyValue('--tc')))].length);
  ok('분류 색: 칸 칩 색 4가지 (' + chipCols + ')', chipCols === 4);
  await p.reload(); await p.waitForTimeout(300); const S2 = await tc();
  ok('분류 색: 다시 열어도 같음', JSON.stringify(S2.tagAuto) === JSON.stringify(S.tagAuto));
  await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('weekday-cal-v1')); S.tagColors = { 회의: 3 }; localStorage.setItem('weekday-cal-v1', JSON.stringify(S)); }); await p.reload(); await p.waitForTimeout(300);
  const dot = await p.evaluate(() => { const b = [...document.querySelectorAll('#grid .chipw')].find(e => e.textContent.includes('회의 항목')); return b.style.getPropertyValue('--tc'); });
  ok('분류 색: 직접 고른 색(tagColors)이 먼저 ' + dot, dot === 'var(--c4)');
  await p.fill('#qa', '새 일 #신규 /11-27'); await p.keyboard.press('Enter'); await p.waitForTimeout(200); const S3 = await tc();
  const use = [0, 0, 0, 0]; Object.entries(S3.tagAuto).forEach(([k, v]) => { if (k !== '신규' && k !== '회의') use[v]++; }); use[3]++;
  ok('분류 색: 새 분류 = 가장 적게 쓰인 색 ' + S3.tagAuto['신규'] + ' ' + JSON.stringify(use), S3.tagAuto['신규'] === use.indexOf(Math.min(...use)));

  // ---- 출석 달력 ----
  await p.evaluate(() => { localStorage.setItem('attend-cal-v1', JSON.stringify(window.__attTest.sampleA())); localStorage.setItem('cal-mode', 'att'); });
  await p.reload(); await p.waitForTimeout(400);
  const B = '#a-months'; s = await st(B);
  ok('출석: 처음 = 2026 · 12월 (AMIN), 11월은 이번 달이지만 범위 밖 ' + JSON.stringify(s), s.yr === '2026' && s.cur === '12월' && s.en === '12월' && s.title === 'DECEMBER' && s.prevDis && s.now === '11월');
  ok('출석: 점 = 방학·휴업일 있는 달 (12월)', s.dots === '12월');
  await p.click('[data-a=next]'); s = await st(B); ok('출석: 다음 → 2027 · 1월', s.yr === '2027' && s.cur === '1월' && s.title === 'JANUARY');
  s = await st(B); ok('출석: 2027 점 = 1·7·8·9·12월 (' + s.dots + ')', s.dots === '1월,7월,8월,9월,12월');
  await p.click(B + ' .mp-m:has-text("9월")'); s = await st(B); ok('출석: 9월 누르기', s.title === 'SEPTEMBER' && s.cur === '9월');
  await p.click('#a-bar [data-a=view][data-v=week]'); await p.waitForTimeout(150);
  for (let i = 0; i < 5; i++) await p.click('[data-a=next]');
  s = await st(B); ok('출석 주: 다음 주로 달이 넘어가면 고르기도 따라감 (' + s.cur + ')', s.cur === '10월' && s.title === 'OCTOBER');
  await p.click(B + ' .mp-s[data-mp="1"]'); await p.click(B + ' .mp-m:has-text("1월")'); s = await st(B);
  ok('출석 주: 2028 · 1월 누르기', s.yr === '2028' && s.cur === '1월' && s.en === '1월' && s.nextDis);
  const wk = await p.evaluate(() => window.__attTest.au.wk); ok('출석 주: 주도 그 달로 (' + wk + ')', wk >= '2027-12-27' && wk <= '2028-01-31');
  await p.focus(B + ' .mp-g [tabindex="0"]'); await p.keyboard.press('ArrowLeft'); s = await st(B); ok('출석: ← 앞 해 12월', s.yr === '2027' && s.focus === '12월');
  await p.keyboard.press('PageUp'); s = await st(B); ok('출석: 고르기 안 PageUp = 연도만 (달은 그대로)', s.yr === '2026' && s.title === 'JANUARY');
  await p.click('[data-a=today]'); s = await st(B); ok('출석: 오늘(범위 밖) → 안내만, 달 그대로', s.title === 'JANUARY' && s.cur === null && await p.locator('#toast').isVisible());
  const at = await p.evaluate(() => document.querySelectorAll('#att .lab.tdy').length); ok('출석: TODAY 글자 없음', at === 0);
  await p.click('#att .modesw [data-mode=admin]'); s = await st(A); ok('모드 바꿔도 업무 달력 고르기 유지', s.title === 'NOVEMBER' && s.yr === '2026');

  console.log('ERRORS', JSON.stringify(errs));
  await b.close(); process.exit(fails || errs.length ? 1 : 0);
})();
