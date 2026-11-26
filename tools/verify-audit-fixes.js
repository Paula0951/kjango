#!/usr/bin/env node
// v17 감사 수정 회귀 테스트: node tools/verify-audit-fixes.js  (모든 줄 PASS, ERRORS [] 이면 통과)
// 1 모바일 작성줄 · 2 칸 밖 중요 칩 대비 · 3 툴팁 가로 스크롤 · 4 잘린 칩 · 5 긴 이름 · 6 Object.prototype 이름 분류 ·
// 7 배열 아닌 저장 데이터 · 8 출결 분석 거꾸로 범위 · 9 PageUp/PageDown 전역 · 10 학생부 직종 칸 · 11 범위 밖 출석 칸 · 12 a11y
// 시계 2026-11-26 10:00 (Asia/Seoul). APP=다른.html 로 다른 파일(예: 수정 전 사본)에 돌려 볼 수 있다.
'use strict';
const { chromium } = require('playwright'); const path = require('path');
const FILE = process.env.APP || path.join(path.resolve(__dirname, '..'), '평일업무달력.html');
const URL_ = 'file://' + FILE;
let fails = 0; const errs = [];
const ok = (name, c) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name); };

const mk = (id, title, due, o) => Object.assign({ id, title, start: '', due, status: 'todo', priority: 'normal', tags: [], assignees: ['나'], memo: '', checklist: [], links: [] }, o || {});
let browser;
async function sec(name, fn) { try { await fn(); } catch (e) { fails++; console.log('FAIL ' + name + ' 실행 중 오류: ' + String(e.message).split('\n')[0].slice(0, 160)); } }
async function open(vp, o) {
  o = o || {};
  const ctx = await browser.newContext({ viewport: vp, timezoneId: 'Asia/Seoul', locale: 'ko-KR', deviceScaleFactor: 1 });
  const p = await ctx.newPage(); p.setDefaultTimeout(5000);
  p.on('pageerror', e => errs.push('pageerror: ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  const seed = { a: o.admin == null ? null : (typeof o.admin === 'string' ? o.admin : JSON.stringify(o.admin)), t: o.att == null ? null : (typeof o.att === 'string' ? o.att : JSON.stringify(o.att)), m: o.mode || 'admin' };
  await p.addInitScript(s => {
    if (localStorage.getItem('__seeded')) return;
    localStorage.clear();
    if (s.a != null) localStorage.setItem('weekday-cal-v1', s.a); else localStorage.setItem('weekday-cal-v1', JSON.stringify({ items: [], customs: [], style: {} }));
    if (s.t != null) localStorage.setItem('attend-cal-v1', s.t);
    localStorage.setItem('cal-mode', s.m); localStorage.setItem('__seeded', '1');
  }, seed);
  await p.clock.setFixedTime(new Date(o.time || '2026-11-26T10:00:00+09:00'));
  await p.goto(URL_ + (o.query || '')); await p.waitForTimeout(250);
  return { p, ctx };
}
const hscroll = p => p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
const sampleAtt = async () => { const { p, ctx } = await open({ width: 1440, height: 900 }, { mode: 'att' }); const a = await p.evaluate(() => JSON.stringify(window.__attTest.sampleA())); await ctx.close(); return a; };
/* CSS 색 → [r,g,b,a] (캔버스로 풀어서 color-mix 등도 처리) */
const RGB = `(c)=>{const x=document.createElement('canvas').getContext('2d',{willReadFrequently:true});x.clearRect(0,0,1,1);x.fillStyle='#000';x.fillStyle=c;x.fillRect(0,0,1,1);const d=x.getImageData(0,0,1,1).data;return [d[0],d[1],d[2],d[3]/255];}`;

(async () => {
  browser = await chromium.launch();
  const ATT = await sampleAtt();

  // ================= 1. 모바일 작성줄 =================
  await sec('1. 모바일 작성줄 =========', async () => {
  for (const w of [390, 360]) {
    const { p, ctx } = await open({ width: w, height: 800 });
    const r = await p.evaluate(() => { const i = document.querySelector('#qa').getBoundingClientRect(); const bs = [...document.querySelectorAll('.qa-box > button')].map(b => b.getBoundingClientRect()); return { w: i.width, left: i.left, right: i.right, btnOK: bs.every(b => b.left >= 0 && b.right <= innerWidth && b.width > 0), n: bs.length }; });
    ok('1 ' + w + 'px: #qa 너비 ≥200 (' + Math.round(r.w) + ')', r.w >= 200 && r.right <= w);
    ok('1 ' + w + 'px: 토큰·보내기 버튼 ' + r.n + '개 모두 화면 안', r.btnOK && r.n >= 6);
    const hs = await hscroll(p); ok('1 ' + w + 'px: 가로 스크롤 없음', hs.sw <= hs.iw);
    await p.fill('#qa', '회의 준비 #보고 @나'); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    ok('1 ' + w + 'px: 입력 후 추가됨', (await p.evaluate(() => JSON.parse(localStorage.getItem('weekday-cal-v1')).items.length)) === 1);
    if (w === 390) await p.screenshot({ path: process.env.SHOT ? process.env.SHOT + '/mobile-390.png' : '/dev/null' }).catch(() => {});
    await ctx.close();
  }
  });

  // ================= 2. 이번 달 밖 칸의 중요 칩·막대 대비 =================
  await sec('2. 이번 달 밖 칸의 중요 칩·막대', async () => {
    const items = [mk('h1', '긴급 보고서', '2026-12-02', { priority: 'high', tags: ['보고'] }), mk('h2', '긴급 기간 막대', '2026-12-03', { priority: 'high', start: '2026-11-30', tags: ['보고'] }), mk('n1', '보통 항목', '2026-12-03', { tags: ['회의'] })];
    const { p, ctx } = await open({ width: 1440, height: 900 }, { admin: { items, customs: [], style: {} } });
    const r = await p.evaluate(`(()=>{const rgb=${RGB};
      const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);};
      const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
      const mix=(f,b,a)=>[f[0]*a+b[0]*(1-a),f[1]*a+b[1]*(1-a),f[2]*a+b[2]*(1-a)];
      const out=document.querySelector('.cell.out[data-day="2026-12-02"]');const cellBg=rgb(getComputedStyle(document.body).backgroundColor);
      const chip=out.querySelector('.chip.high'),t=chip.querySelector('.t'),cs=getComputedStyle(chip),op=+cs.opacity;
      const bg=mix(rgb(cs.backgroundColor),[26,20,15],op),fg=mix(rgb(getComputedStyle(t).color),[26,20,15],op);
      const bar=document.querySelector('.cell.out .rb.high'),bs=getComputedStyle(bar);
      const barBg=rgb(bs.backgroundColor),barFg=rgb(bs.color);
      const nor=document.querySelector('.cell.out[data-day="2026-12-03"] .chip:not(.high)');
      return {chip:cr(bg,fg),op,bar:cr(barBg,barFg),barColor:bs.color,norColor:getComputedStyle(nor).color};})()`);
    ok('2 칸 밖 중요 칩 글자 대비 ' + r.chip.toFixed(1) + ':1 (opacity ' + r.op + ')', r.chip >= 4.5);
    ok('2 칸 밖 중요 기간 막대 글자 대비 ' + r.bar.toFixed(1) + ':1', r.bar >= 4.5);
    ok('2 칸 밖 보통 칩은 여전히 muted (' + r.norColor + ')', r.norColor !== 'rgb(232, 217, 197)');
    await ctx.close();
  });

  // ================= 3. 툴팁이 가로 스크롤을 만들지 않음 =================
  await sec('3. 툴팁이 가로 스크롤을 만들지 않', async () => {
  for (const w of [901, 1024, 1114, 1280]) {
    const { p, ctx } = await open({ width: w, height: 800 }, { att: ATT, mode: 'att', time: '2026-12-10T10:00:00+09:00' });
    let hs = await hscroll(p); const m1 = hs;
    await p.click('[data-a=view][data-v=week]'); await p.waitForTimeout(80); hs = await hscroll(p);
    ok('3 출석 ' + w + 'px 월 ' + m1.sw + ' / 주 ' + hs.sw + ' ≤ ' + hs.iw, m1.sw <= m1.iw && hs.sw <= hs.iw);
    await p.click('#att .modesw [data-mode=admin]'); await p.waitForTimeout(150);
    const ha = await hscroll(p); await p.click('[data-act=nextup]').catch(() => {});
    ok('3 업무 ' + w + 'px ' + ha.sw + ' ≤ ' + ha.iw, ha.sw <= ha.iw);
    await ctx.close();
  }
  {
    const { p, ctx } = await open({ width: 1024, height: 800 }, { att: ATT, mode: 'att', time: '2026-12-10T10:00:00+09:00' });
    const t = await p.evaluate(() => { const ti = document.querySelector('#a-bar .ti'); return { disp: getComputedStyle(ti.querySelector('.tt')).display, ad: ti.getAttribute('aria-describedby'), txt: document.getElementById(ti.getAttribute('aria-describedby')).textContent.length }; });
    ok('3 숨은 툴팁 display:none · aria-describedby 대상은 그대로 (' + t.disp + ',' + t.txt + '자)', t.disp === 'none' && t.txt > 10);
    await p.hover('#a-bar .ti'); const sh = await p.evaluate(() => { const tt = document.querySelector('#a-bar .ti .tt'), r = tt.getBoundingClientRect(); return { d: getComputedStyle(tt).display, in: r.left >= 0 && r.right <= innerWidth }; });
    ok('3 호버하면 보이고 화면 안', sh.d === 'block' && sh.in);
    await p.keyboard.press('Escape');
    // 오른쪽 끝 툴팁: 설정 창 안의 ⓘ 들이 호버 시 화면을 벗어나지 않음
    await p.click('[data-a=open][data-m=days]'); await p.waitForTimeout(100);
    const nti = await p.locator('#amodal .ti').count(), bad = [];
    for (let i = 0; i < nti; i++) { const ti = p.locator('#amodal .ti').nth(i); await ti.hover(); const r = await ti.locator('.tt').boundingBox(); if (!r || r.x < 0 || r.x + r.width > 1024) bad.push([i, r && Math.round(r.x), r && Math.round(r.x + r.width)]); }
    ok('3 모달 안 ⓘ ' + nti + '개 호버 시 툴팁이 화면 안 (' + JSON.stringify(bad) + ')', nti > 0 && bad.length === 0);
    await ctx.close();
  }
  });

  // ================= 4. 잘린 칩 없음 =================
  await sec('4. 잘린 칩 없음 =========', async () => {
    const items = [];
    const days = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24'];
    days.forEach((d, i) => { items.push(mk('a' + i, '회의 ' + i, d, { tags: ['회의'] })); items.push(mk('b' + i, '보고서 작성 ' + i, d, { tags: ['보고'], priority: i % 2 ? 'high' : 'normal' })); });
    items.push(mk('r1', '기간 막대 하나', '2026-11-19', { start: '2026-11-16', tags: ['행사'] }), mk('r2', '기간 막대 둘', '2026-11-24', { start: '2026-11-18', tags: ['예산'], priority: 'high' }), mk('c1', '추가 일정', '2026-11-18', { tags: ['점검'] }));
    for (const vp of [{ width: 900, height: 700 }, { width: 1024, height: 600 }, { width: 1440, height: 900 }]) {
      const { p, ctx } = await open(vp, { admin: { items, customs: [], style: {} } });
      const r = await p.evaluate(() => { let bad = 0, seen = 0, more = 0; const det = []; document.querySelectorAll('#grid .cell').forEach(c => { const cr = c.getBoundingClientRect(); if (c.querySelector('.more')) more++; c.querySelectorAll('.chipw:not([hidden]),.rl>.rb:not([hidden]):not(.ph)').forEach(x => { const r = x.getBoundingClientRect(); if (!r.height) return; seen++; if (r.bottom > cr.bottom + 2 || r.top < cr.top - 2)/* 서브픽셀 1px 오차는 허용 (fitChips 도 +1px 허용) */ { bad++; det.push([c.dataset.day, x.className, Math.round(r.bottom - cr.bottom)]); } }); }); return { bad, seen, more, det: det.slice(0, 3), h: document.documentElement.scrollHeight, ih: innerHeight }; });
      ok('4 ' + vp.width + '×' + vp.height + ': 잘린 칩·막대 0개 (보이는 ' + r.seen + ', "+N 더" 칸 ' + r.more + ') ' + JSON.stringify(r.det), r.bad === 0 && r.seen > 0);
      await ctx.close();
    }
  });

  // ================= 5. 긴 이름 =================
  await sec('5. 긴 이름 ============', async () => {
    const LONG = '가나다라마바사아자차카타파하'.repeat(6), WHO = 'abcdefghijklmnopqrstuvwxyz0123456789'.repeat(3);
    const items = [mk('l1', '긴 이름 항목', '2026-11-26', { tags: [LONG, '짧은'], assignees: [WHO] })];
    const { p, ctx } = await open({ width: 1440, height: 900 }, { admin: { items, customs: [], style: {} } });
    await p.click('#grid .chip[data-id=l1]'); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const d = document.getElementById('detail'), dr = d.getBoundingClientRect(); const chips = [...d.querySelectorAll('.cp-chips .hc')].map(c => { const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, hn: c.querySelector('.hn').title }; }); return { sw: d.querySelector('.db').scrollWidth, cw: d.querySelector('.db').clientWidth, dr: dr.right, chips, ell: [...d.querySelectorAll('.cp-chips .hc .hn')].some(h => h.scrollWidth > h.clientWidth) }; });
    ok('5 상세 패널: 가로 넘침 없음 (' + r.sw + '/' + r.cw + ')', r.sw <= r.cw);
    ok('5 상세 패널: 긴 칩이 패널 안 + 말줄임 + 전체 이름 title', r.chips.every(c => c.r <= r.dr) && r.ell && r.chips.some(c => c.hn.includes(LONG)));
    await p.click('[data-act=closed]');
    await p.click('[data-act=settings][data-tab=days]'); await p.click('#tab-tags'); await p.waitForTimeout(120);
    const s = await p.evaluate(() => { const m = document.getElementById('modal').getBoundingClientRect(), b = document.getElementById('setb'); const del = [...document.querySelectorAll('[data-act=tgarm]')].map(x => x.getBoundingClientRect()); return { sw: b.scrollWidth, cw: b.clientWidth, delIn: del.length > 0 && del.every(r => r.right <= m.right && r.left >= m.left) }; });
    ok('5 설정 › 태그: 가로 넘침 없음 · 삭제 버튼이 창 안 (' + s.sw + '/' + s.cw + ')', s.sw <= s.cw && s.delIn);
    await p.keyboard.press('Escape');
    await p.click('#nav-filter'); await p.waitForTimeout(80);
    const f = await p.evaluate(() => { const sd = document.getElementById('side'); return { sw: sd.scrollWidth, cw: sd.clientWidth }; });
    ok('5 필터 패널: 가로 넘침 없음 (' + f.sw + '/' + f.cw + ')', f.sw <= f.cw);
    await ctx.close();
  });

  // ================= 6. Object.prototype 이름 분류 =================
  await sec('6. Object.prototype ', async () => {
    const NAMES = ['constructor', 'valueOf', 'toString', '__proto__', 'hasOwnProperty'];
    const items = NAMES.map((t, i) => mk('p' + i, t + ' 항목', '2026-11-' + String(16 + i), { tags: [t], assignees: [t] }));
    const { p, ctx } = await open({ width: 1440, height: 900 }, { admin: { items, customs: [], style: {} } });
    const r = await p.evaluate(() => [...document.querySelectorAll('#grid .chipw')].map(e => e.style.getPropertyValue('--tc')));
    ok('6 이름이 Object.prototype 멤버인 분류도 색이 있음 ' + JSON.stringify(r), r.length === 5 && r.every(c => /^var\(--c[0-4]\)$/.test(c)));
    /* (Playwright 직렬화는 __proto__ 키를 떨구므로 값은 페이지 안에서 계산해서 가져온다) */
    const st = await p.evaluate(names => { const a = JSON.parse(localStorage.getItem('weekday-cal-v1')).tagAuto; return { keys: Object.keys(a).sort().join(), vals: names.map(n => Object.prototype.hasOwnProperty.call(a, n) ? a[n] : 'MISSING') }; }, NAMES);
    ok('6 tagAuto 에 모두 자기 키로 저장 · __proto__ 도 ' + JSON.stringify(st), st.vals.every(Number.isInteger) && st.keys.split(',').length === 5);
    const used = new Set(st.vals);
    ok('6 색이 한 가지로 몰리지 않음 (' + [...used] + ')', used.size >= 3);
    await p.click('#nav-filter'); await p.waitForTimeout(80);
    const side = await p.evaluate(() => [...document.querySelectorAll('#side .sbtn')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(t => /constructor|valueOf|toString|__proto__|hasOwnProperty/.test(t)));
    ok('6 필터 패널 분류·담당 개수가 숫자 1 ' + JSON.stringify(side.slice(0, 3)), side.length === 10 && side.every(t => /1$/.test(t) && !/function|NaN|undefined/.test(t)));
    await p.evaluate(() => document.getElementById('nav-filter').click());
    // 백업 불러오기(JSON 의 "__proto__" 키)가 객체를 오염시키지 않음
    const pol = await p.evaluate(() => { const raw = '{"items":[{"id":"z1","title":"t","due":"2026-11-20","tags":["__proto__"]}],"tagColors":{"__proto__":2,"constructor":1}}'; const S = window.__adm.normalize(JSON.parse(raw)); return { c: S.tagColors['__proto__'], k: S.tagColors.constructor, polluted: ({}).polluted, proto: Object.getPrototypeOf(S.tagColors) === null, hasOwn: Object.keys(S.tagColors).sort().join() }; });
    ok('6 __proto__ 키 정규화: 평범한 키로 보존 ' + JSON.stringify(pol), pol.c === 2 && pol.k === 1 && pol.proto && pol.hasOwn === '__proto__,constructor' && pol.polluted === undefined);
    await ctx.close();
  });

  // ================= 7. 배열 아닌 저장 데이터 =================
  await sec('7. 배열 아닌 저장 데이터 ====', async () => {
    const bad = { items: [
      { id: 'a1', title: '태그가 문자열', due: '2026-11-18', tags: '회의', assignees: '나' },
      { id: 'a2', title: '태그가 숫자·null', due: '2026-11-19', tags: 5, assignees: null, checklist: {}, links: 'x' },
      { id: 'a3', title: '목록 안에 잡동사니', due: '2026-11-20', tags: ['ok', 3, null, { a: 1 }, ''], assignees: [['x']], checklist: ['문자열 하위', { t: '객체', d: 1 }, null], links: [null, 'x', { id: 'l1', name: 'f.pdf', path: 'C:\\f.pdf' }] },
      { id: 'a4', due: '2026-11-21' }, { title: '아이디 없음', due: '2026-11-21' }, { id: 'a5', title: '날짜 없음' }, null, 'junk', 7,
      { id: 'a6', title: '상태 이상', due: '2026-11-24', status: 'weird', priority: 'urgent' }],
      customs: [{ id: 'c1', date: '2026-11-27', name: '지정일', color: 'red' }, { date: 'bad' }, 'x'], disabledHol: 'no', tagColors: [1], tagAuto: 'x', style: 'str', wp: [], kw: 3, syn: 'x' };
    const { p, ctx } = await open({ width: 1440, height: 900 }, { admin: bad });
    const t = await p.evaluate(() => document.querySelectorAll('#grid .chip').length);
    const n = await p.evaluate(() => { const S = window.__adm.normalize(JSON.parse(localStorage.getItem('weekday-cal-v1') || '{}')); return S.items.map(i => i.id + ':' + Array.isArray(i.tags) + Array.isArray(i.assignees) + Array.isArray(i.checklist) + Array.isArray(i.links) + ':' + i.tags.join('|') + ':' + i.assignees.join('|')); });
    ok('7 깨진 항목이 있어도 로드 · 칩 ' + t + '개 (id·제목·날짜 없는 것만 버림)', t === 4 && n.length === 4);
    ok('7 문자열 tags/assignees → [문자열] · 숫자/null → [] ' + JSON.stringify(n.slice(0, 3)), n[0].startsWith('a1:truetruetruetrue:회의:나') && n[1].startsWith('a2:truetruetruetrue::') && n[2].startsWith('a3:truetruetruetrue:ok|3:'));
    const cl = await p.evaluate(() => { const S = window.__adm.normalize({ items: [{ id: 'a3', title: 't', due: '2026-11-20', checklist: ['문자열 하위', { t: '객체', d: 1 }, null], links: [null, 'x', { id: 'l1', name: 'f.pdf', path: 'C:\\f.pdf' }] }] }); return [S.items[0].checklist.length, S.items[0].checklist[1].d, S.items[0].links.length]; });
    ok('7 checklist·links 정리 ' + JSON.stringify(cl), cl[0] === 2 && cl[1] === true && cl[2] === 1);
    await p.click('#nav-filter'); await p.click('[data-act=settings][data-tab=days]'); await p.click('#tab-tags'); await p.waitForTimeout(100);
    ok('7 설정·필터·상세 열어도 오류 없음', true);
    await p.keyboard.press('Escape'); await p.click('#grid .chip'); await p.waitForTimeout(100);
    // 출석 달력 데이터
    const att = { tracks: 'x', students: [null, 3, { id: 's1', name: 'n', track: 'nope' }, { id: 's1', name: 'dup' }], lecturers: { a: 1 }, periods: ['a', null, 1, 2, 3, 4], kinds: [1, 2], offs: [{ id: 'o1', from: '2026-12-02', periods: 'x' }, { id: 'o1', from: '2026-12-03' }], lect: [], spec: 'x', att: [1], subjects: 5, disabledHol: 'x', ex: 1 };
    const g = await open({ width: 1440, height: 900 }, { att, mode: 'att' });
    const r = await g.p.evaluate(() => { const A = window.__attTest.A; return [Array.isArray(A.tracks), A.students.length, A.kinds.length > 0, A.periods.length, A.offs.length, Array.isArray(A.subjects)]; });
    ok('7 출석 달력: 배열 아닌 필드가 있어도 로드 · 정리 ' + JSON.stringify(r), r[0] && r[1] === 1 && r[2] && r[3] === 6 && r[4] === 1 && r[5]);
    await g.p.click('[data-a=open][data-m=roster]').catch(() => {}); await g.ctx.close();
    await ctx.close();
  });

  // ================= 8. 출결 분석: 학기 시작 전 =================
  await sec('8. 출결 분석: 학기 시작 전 ==', async () => {
    const { p, ctx } = await open({ width: 1440, height: 900 }, { att: ATT, mode: 'att' });
    await p.click('[data-a=open][data-m=stats]'); await p.waitForTimeout(100);
    const h = await p.evaluate(() => ({ head: document.querySelector('#amodal .mh h2').textContent.replace(/\s+/g, ' ').trim() }));
    ok('8 학기 시작 전: 안내 문구 · 거꾸로 범위 없음 "' + h.head + '"', /학기 시작 전 \(2026\.12\.01부터 집계\)/.test(h.head) && !/2026\.12\.01 – 2026\.11\.26/.test(h.head));
    await p.click('#st-upto'); await p.waitForTimeout(80);
    const h2 = await p.evaluate(() => document.querySelector('#amodal .mh h2').textContent.replace(/\s+/g, ' ').trim());
    ok('8 "오늘까지만" 끄면 정상 범위 "' + h2 + '"', /2026\.12\.01 – 2026\.12\.31/.test(h2));
    await ctx.close();
    const g = await open({ width: 1440, height: 900 }, { att: ATT, mode: 'att', time: '2026-12-10T10:00:00+09:00' });
    await g.p.click('[data-a=open][data-m=stats]'); await g.p.waitForTimeout(100);
    const h3 = await g.p.evaluate(() => document.querySelector('#amodal .mh h2').textContent.replace(/\s+/g, ' ').trim());
    ok('8 학기 중에는 그대로 "' + h3 + '"', /2026\.12\.01 – 2026\.12\.10/.test(h3));
    await g.ctx.close();
  });

  // ================= 9. 업무 달력 PageUp/PageDown 전역 =================
  await sec('9. 업무 달력 PageUp/Page', async () => {
    const { p, ctx } = await open({ width: 1440, height: 900 });
    const title = () => p.evaluate(() => document.getElementById('mtitle').textContent);
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await p.keyboard.press('PageDown'); ok('9 날짜 칸에 포커스 없어도 PageDown → DECEMBER', (await title()) === 'DECEMBER');
    await p.keyboard.press('PageUp'); ok('9 PageUp → NOVEMBER', (await title()) === 'NOVEMBER');
    await p.click('#nav-filter'); await p.keyboard.press('PageDown'); ok('9 버튼에 포커스가 있어도 PageDown (' + (await title()) + ')', (await title()) === 'DECEMBER'); await p.keyboard.press('PageUp');
    await p.focus('#qa'); await p.keyboard.press('PageDown'); ok('9 입력칸에선 달 안 바뀜', (await title()) === 'NOVEMBER');
    await p.evaluate(() => document.activeElement.blur()); await p.keyboard.press('Control+PageDown'); ok('9 Ctrl+PageDown(브라우저 탭 이동)은 가로채지 않음', (await title()) === 'NOVEMBER');
    await p.click('[data-act=full]'); await p.waitForTimeout(80); await p.keyboard.press('PageDown'); await p.keyboard.press('Escape');
    ok('9 모달이 열려 있으면 안 바뀜', (await title()) === 'NOVEMBER');
    await p.focus('#grid .cell[data-day="2026-11-26"]'); await p.keyboard.press('PageDown'); ok('9 날짜 칸 포커스: 기존대로', (await title()) === 'DECEMBER');
    await ctx.close();
  });

  // ================= 10. 학생부 직종 칸 너비 =================
  await sec('10. 학생부 직종 칸 너비 ====', async () => {
    const { p, ctx } = await open({ width: 1440, height: 900 }, { att: ATT, mode: 'att' });
    await p.click('[data-a=open][data-m=roster]'); await p.waitForTimeout(100);
    const r = await p.evaluate(() => { const sels = [...document.querySelectorAll('#amodal select[data-f=track]')]; const w = (txt, el) => { const s = document.createElement('span'); const cs = getComputedStyle(el); s.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:' + cs.font; s.textContent = txt; document.body.appendChild(s); const x = s.getBoundingClientRect().width; s.remove(); return x; };
      return sels.map(s => ({ name: s.options[s.selectedIndex].text, sel: s.getBoundingClientRect().width, need: Math.max(...[...s.options].map(o => w(o.text, s))) })); });
    ok('10 직종 select 가 가장 긴 이름(제과제빵)보다 넓음 ' + JSON.stringify(r.slice(0, 1).concat(r.filter(x => x.name === '제과제빵').slice(0, 1))), r.length > 0 && r.every(x => x.sel >= x.need + 20) && r.some(x => x.name === '제과제빵'));
    await ctx.close();
  });

  // ================= 11. 달력 범위 밖 출석 칸 =================
  await sec('11. 달력 범위 밖 출석 칸 ===', async () => {
    const { p, ctx } = await open({ width: 1440, height: 900 }, { att: ATT, mode: 'att', time: '2026-12-10T10:00:00+09:00' });
    await p.evaluate(() => { window.__attTest.au.mi = 0; }); await p.click('#a-months .mp-m:has-text("12월")'); await p.waitForTimeout(100);
    const c = await p.evaluate(() => { const e = document.querySelector('#a-grid .cell[data-k="2026-11-30"]'), d = document.querySelector('#a-grid .cell[data-k="2026-12-01"]'); return { cls: e.className, act: e.getAttribute('data-a'), role: e.getAttribute('role'), dis: e.getAttribute('aria-disabled'), label: e.getAttribute('aria-label'), txt: e.textContent.trim(), dAct: d.getAttribute('data-a'), tab: e.tabIndex }; });
    ok('11 월 보기: 11/30 = 흐린 범위 밖 칸 · 눌러도 안 열림 ' + JSON.stringify(c), /\boor\b/.test(c.cls) && c.act == null && c.role == null && c.dis === 'true' && !/수업 \d교시/.test(c.label) && /범위 밖/.test(c.label) && c.txt === '30' && c.dAct === 'day' && c.tab === -1);
    await p.click('#a-grid .cell[data-k="2026-11-30"]', { force: true }); await p.waitForTimeout(100);
    ok('11 11/30 칸 클릭 → 하루 창 안 열림', await p.evaluate(() => !window.__attTest.au.modal));
    const sc = await p.evaluate(() => { const T = window.__attTest; const s = T.A.students[0]; const o = T.statStu(s, '2026-11-30', '2026-11-30'); return { ps: T.sched('2026-11-30', '').ps.length, ps2: T.sched('2026-11-30', T.A.tracks[0].id).ps.length, sd: o.sd, febPs: T.sched('2028-02-01', '').ps.length, lastIn: T.sched('2028-01-31', '').ps.length, firstIn: T.sched('2026-12-01', '').ps.length }; });
    ok('11 sched: 범위 밖은 수업 0교시 · 통계 0 · 범위 안은 그대로 ' + JSON.stringify(sc), sc.ps === 0 && sc.ps2 === 0 && sc.sd === 0 && sc.febPs === 0 && sc.lastIn === 6 && sc.firstIn === 6);
    const hero = await p.evaluate(() => document.getElementById('a-stat').textContent.replace(/\s+/g, ''));
    ok('11 12월 소정일 = 12월 평일만 (' + hero.slice(0, 12) + ')', /^\d+소정일/.test(hero));
    await p.keyboard.press('Home').catch(() => {});
    await p.click('[data-a=view][data-v=week]'); await p.waitForTimeout(100); await p.click('#att [data-a=prev]'); await p.waitForTimeout(100);
    const w = await p.evaluate(() => { const col = [...document.querySelectorAll('#a-body [data-pc][data-k="2026-11-30"]')]; const wh = document.querySelector('.wh.oor'); const selcol = document.querySelector('.selb[data-k="2026-11-30"]'); return { n: col.length, dis: col.every(b => b.disabled), oor: col.every(b => b.classList.contains('oor')), wh: !!wh && wh.tagName === 'DIV' && /범위 밖/.test(wh.textContent), selDis: selcol.disabled, ok: [...document.querySelectorAll('#a-body [data-pc][data-k="2026-12-01"]')].every(b => !b.disabled), label: col[0].getAttribute('aria-label') }; });
    ok('11 주 보기: 11/30 열 = 흐림 · 교시 칸 비활성 · "범위 밖" 머리 ' + JSON.stringify(w), w.n === 6 && w.dis && w.oor && w.wh && w.selDis && w.ok && !/수업 6교시/.test(w.label));
    await p.click('#a-body .pc[data-k="2026-11-30"][data-p="1"]', { force: true }).catch(() => {});
    await p.mouse.move(0, 0);
    const box = await p.locator('#a-body .pc[data-k="2026-12-01"][data-p="1"]').boundingBox(), box2 = await p.locator('#a-body .pc[data-k="2026-11-30"][data-p="3"]').boundingBox();
    await p.mouse.move(box2.x + 5, box2.y + 5); await p.mouse.down(); await p.mouse.move(box.x + 20, box.y + box.height * 3, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(80);
    const sel = await p.evaluate(() => [...window.__attTest.au.sel]);
    ok('11 범위 밖 칸이 선택에 안 섞임 ' + JSON.stringify(sel.slice(0, 4)), sel.every(k => !k.startsWith('2026-11-30')));
    await p.click('.selb[data-k="2026-12-01"]'); await p.click('#a-body .pl[data-a=selrow][data-p="2"]'); await p.waitForTimeout(60);
    ok('11 "N교시 전체 요일" 선택도 범위 밖 제외', await p.evaluate(() => [...window.__attTest.au.sel].every(k => !k.startsWith('2026-11-30'))));
    // 끝: 2028.02 가장자리
    await p.click('[data-a=view][data-v=month]'); await p.click('#a-months .mp-s[data-mp="1"]'); await p.click('#a-months .mp-s[data-mp="1"]'); await p.click('#a-months .mp-m:has-text("1월")'); await p.waitForTimeout(100);
    const e = await p.evaluate(() => { const f = document.querySelector('#a-grid .cell[data-k="2028-02-01"]'); return f ? { cls: f.className, act: f.getAttribute('data-a') } : null; });
    ok('11 2028-02 가장자리 칸도 범위 밖 ' + JSON.stringify(e), e && /\boor\b/.test(e.cls) && e.act == null);
    await ctx.close();
  });

  // ================= 12. a11y =================
  await sec('12. a11y ===========', async () => {
    const { p, ctx } = await open({ width: 1440, height: 900 });
    const ex = () => p.evaluate(() => document.getElementById('nav-filter').getAttribute('aria-expanded'));
    ok('12 #nav-filter 처음 aria-expanded=false', (await ex()) === 'false');
    await p.click('#nav-filter'); await p.waitForTimeout(30); ok('12 눌러 열면 true', (await ex()) === 'true');
    await p.keyboard.press('Escape'); await p.waitForTimeout(30); ok('12 Esc 로 닫으면 false', (await ex()) === 'false');
    await p.click('#nav-filter'); await p.click('[data-act=full]'); await p.waitForTimeout(60); ok('12 전체보기를 열면 패널이 닫히며 false', (await ex()) === 'false'); await p.keyboard.press('Escape');
    await p.click('#nav-filter'); await p.click('#nav-filter'); await p.waitForTimeout(30); ok('12 다시 누르면 false', (await ex()) === 'false');
    const rv = () => p.evaluate(() => [...document.querySelectorAll('.modesw')].map(g => [...g.querySelectorAll('[role=radio]')].map(b => b.getAttribute('aria-checked') + ':' + b.tabIndex).join(' ')));
    let r = await rv();
    ok('12 라디오: 켜진 것만 tabindex 0 (' + JSON.stringify(r) + ')', r.every(x => x === 'true:0 false:-1'));
    ok('12 라디오 이름: 업무 / 출석', await p.evaluate(() => [...document.querySelectorAll('#app .modesw button')].map(b => b.textContent).join('/')) === '업무/출석' && await p.evaluate(() => [...document.querySelectorAll('#att .modesw button')].map(b => b.textContent).join('/')) === '업무/출석');
    await p.focus('#app .modesw [data-mode=admin]'); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
    r = await rv();
    const f = await p.evaluate(() => ({ mode: document.body.dataset.mode, id: document.activeElement.closest('#att') ? 'att' : 'x', m: document.activeElement.dataset.mode }));
    ok('12 → 키로 출석 달력 전환 · 포커스가 새 달력의 출석 라디오로 ' + JSON.stringify(f), f.mode === 'att' && f.id === 'att' && f.m === 'att');
    ok('12 전환 뒤 두 묶음 모두 출석만 tabindex 0 (' + JSON.stringify(r) + ')', r.every(x => x === 'false:-1 true:0'));
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(100);
    ok('12 ← 키로 업무 달력 복귀', (await p.evaluate(() => document.body.dataset.mode)) === 'admin' && (await rv()).every(x => x === 'true:0 false:-1'));
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(80);
    ok('12 ↓ 두 번 = 한 바퀴(출석 → 업무)', (await p.evaluate(() => document.body.dataset.mode)) === 'admin');
    await p.evaluate(() => document.activeElement.blur()); await p.click('#app .modesw [data-mode=att]'); await p.waitForTimeout(100);
    ok('12 마우스 클릭도 전환', (await p.evaluate(() => document.body.dataset.mode)) === 'att');
    await ctx.close();
  });

  // ================= 13–17 (문구·정리) 빠른 확인 =================
  await sec('13–17 (문구·정리) 빠른 확인 ', async () => {
    const { p, ctx } = await open({ width: 1440, height: 900 });
    const html = await p.evaluate(() => document.body.innerText);
    ok('rename: 화면에 "행정" 달력 이름 없음 (사용자 데이터 제외)', !/행정\s*(달력|\/|출석)/.test(html) && !(await p.evaluate(() => /행정/.test([...document.querySelectorAll('.modesw, [aria-label], [title]')].map(e => (e.textContent || '') + (e.getAttribute('aria-label') || '') + (e.getAttribute('title') || '')).join('')))));
    const t = await p.evaluate(() => { const cs = getComputedStyle(document.documentElement); return [cs.getPropertyValue('--shadow').trim(), cs.getPropertyValue('--scrim').trim().slice(0, 9), document.querySelectorAll('symbol#i-stack,symbol#i-set,symbol#i-s,symbol#i-menu,symbol#i-save').length, document.querySelector('svg[aria-label=폴더]') ? 1 : 0]; });
    ok('토큰 --shadow/--scrim · 안 쓰는 아이콘 제거 ' + JSON.stringify(t), t[0] === '#000' && t[1] === 'color-mix' && t[2] === 0);
    await p.click('[data-act=settings][data-tab=days]'); await p.click('#tab-fixed'); await p.waitForTimeout(80);
    const names = await p.evaluate(() => [...document.querySelectorAll('#modal [data-fxf=name]')].map(i => i.value));
    ok('FX_DEF 이름: 동계 방학 (26–27) / (27–28) 구분 ' + JSON.stringify(names), names.includes('동계 방학 (26–27)') && names.includes('동계 방학 (27–28)'));
    await ctx.close();
    const g = await open({ width: 1440, height: 900 }, { att: ATT, mode: 'att' });
    const ti = await g.p.evaluate(() => [...document.querySelectorAll('#att [data-a=prev],#att [data-a=next]')].map(b => b.title + '|' + b.getAttribute('aria-label')));
    await g.p.click('[data-a=view][data-v=week]'); await g.p.waitForTimeout(80);
    const tw = await g.p.evaluate(() => [...document.querySelectorAll('#att [data-a=prev],#att [data-a=next]')].map(b => b.title));
    ok('출석 이전/다음 버튼 제목 ' + JSON.stringify(ti) + ' → 주 보기 ' + JSON.stringify(tw), ti[0] === '이전 달 (PageUp)|이전 달' && ti[1] === '다음 달 (PageDown)|다음 달' && tw[0] === '이전 주 (PageUp)' && tw[1] === '다음 주 (PageDown)');
    await g.p.click('[data-a=today]'); await g.p.waitForTimeout(60);
    const toast = await g.p.evaluate(() => document.getElementById('toast').textContent);
    ok('범위 밖 오늘 안내 문구 통일 "' + toast + '"', toast === '오늘은 달력 범위 밖이에요 (2026.12 – 2028.01)');
    await g.ctx.close();
  });

  await browser.close();
  console.log('ERRORS ' + JSON.stringify(errs));
  if (fails || errs.length) process.exitCode = 1;
})();
