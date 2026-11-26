#!/usr/bin/env node
// 출석률 규칙 테스트: node tools/verify-attendance-rate.js  (모든 줄 PASS, ERRORS [] 이면 통과)
// 출석인정일수(유고 = 출석 인정) · 실출석일수 · 환산결석 · 타 국비 종료일(단위기간 시작) · 80% 미달/위험 판정 · 화면·엑셀 표시
// 시계 2026-12-10 10:00. 2026년 12월 소정일 = 평일 23일 − 성탄절 = 22일
const {chromium}=require('playwright');const path=require('path');const ROOT=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];
pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await pg.clock.install({time:new Date('2026-12-10T10:00:00+09:00')});
await pg.goto('file://'+path.join(ROOT,'평일업무달력.html')+'?mode=att');
const ok=(n,c,x)=>console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' '+JSON.stringify(x):''));
const r=await pg.evaluate(()=>{const T=window.__attTest,f=T.A;
  const st=(id,o)=>Object.assign({id,name:id,track:'t1',no:'',admit:'2026-12-01',complete:'',commute:'Y',dorm:'',cnp:'N',memo:''},o||{});
  const A={tracks:[{id:'t1',name:'용접'}],students:[st('s1'),st('s2',{govEnd:'2026-12-04'}),st('s3'),st('s4'),st('s5'),st('s6',{govEnd:'2026-12-31'})],att:{}};
  const put=(id,d,s,p)=>A.att['2026-12-'+d+'|'+id]=p?{s,p}:{s};
  put('s1','01','유고결석');put('s1','02','유고결석');put('s1','03','무단결석');['04','07','08','09'].forEach(d=>put('s1',d,'지각',[1]));
  put('s2','02','무단결석');put('s2','07','무단결석');/* 12/2는 타 국비 기간 → 안 셈 */
  ['01','02','03','04','07'].forEach(d=>put('s3',d,'무단결석'));
  ['01','02','03'].forEach(d=>put('s4',d,'무단결석'));
  ['01','02'].forEach(d=>put('s5',d,'무단결석'));
  T.A=A;const o=T.statStu(T.A.students[0],'2026-12-01','2026-12-31');
  const m={y:2026,m:11},risk=id=>{const x=T.unitRisk(T.A.students.find(s=>s.id===id),m);return x&&[x.st,x.sd,x.need,x.left,x.pend];};
  return {s1:[o.sd,o.ia,o.ra,o.yu,o.mu,o.ji,o.hw,o.abs,Math.round(o.rate*1e4)/1e4,o.cd+o.dd],
    s2:T.statStu(T.A.students[1],'2026-12-01','2026-12-31'),r:{s1:risk('s1'),s2:risk('s2'),s3:risk('s3'),s4:risk('s4'),s5:risk('s5'),s6:risk('s6')}};});
ok('s1 소정22 · 인정20 · 실출석19 · 유고2 · 무단1 · 지각4 · 환산1 · 결석계2 · 20/22',JSON.stringify(r.s1)===JSON.stringify([22,20,19,2,1,4,1,2,0.9091,20]),r.s1);
ok('s2 타 국비 12/4 종료 → 소정 18, 12/2 무단은 안 셈',r.s2.sd===18&&r.s2.mu===1&&r.s2.ia===17,[r.s2.sd,r.s2.mu,r.s2.ia]);
ok('s1 판정 충족 (필요 18 · 허용 2 · 지조결 누적 1)',JSON.stringify(r.r.s1)===JSON.stringify(['ok',22,18,2,1]),r.r.s1);
ok('s3 무단 5 → 미달 (남은 날 다 나와도)',r.r.s3[0]==='fail'&&r.r.s3[3]===-1,r.r.s3);
ok('s4 무단 3 → 위험 (허용 1)',r.r.s4[0]==='warn'&&r.r.s4[3]===1,r.r.s4);
ok('s5 무단 2 → 충족 (허용 2)',r.r.s5[0]==='ok'&&r.r.s5[3]===2,r.r.s5);
ok('s6 그 달 내내 타 국비 → 판정 없음',r.r.s6===null,r.r.s6);
// 화면: 상단 숫자, 분석 모달 판정 표, 하루 모달 배지
await pg.click('#att [data-mode=admin]');await pg.click('#app [data-mode=att]');
const hero=await pg.locator('#a-stat .rkb').innerText();ok('상단 "80% 미달·위험" = 2',/^2\s*80% 미달·위험/.test(hero),hero);
await pg.click('#a-stat .rkb');const lab=await pg.locator('#amodal table.risk tbody tr td:first-child').allInnerTexts();
ok('분석 모달: 미달 → 위험 → 충족 순',JSON.stringify(lab)===JSON.stringify(['미달','위험','충족','충족','충족']),lab);
const head=await pg.locator('#amodal table.atbl:not(.risk) thead').first().innerText();ok('학생별 표에 출석인정·실출석',/출석인정/.test(head)&&/실출석/.test(head));
await pg.keyboard.press('Escape');await pg.click('#a-grid .cell[data-k="2026-12-10"]');
const badges=await pg.locator('#amodal .srow2 .ab.rk').allInnerTexts();ok('하루 모달 배지 2개',badges.length===2,badges);await pg.keyboard.press('Escape');
// 엑셀: 수당 기초자료
const wb=await pg.evaluate(()=>{const T=window.__attTest,sh=T.buildWorkbook({from:0,to:0,track:'',upto:1,sh:{allow:1,mstat:1}});
  const al=sh.find(s=>s.name==='수당 기초자료'),hi=al.rows.findIndex(r=>r[0]&&r[0].v==='직종'),h=al.rows[hi].map(c=>c.v),row=n=>al.rows.find(r=>r[1]&&r[1].v===n);
  const col=l=>h.indexOf(l);return {h,s3:[row('s3')[col('80% 판정')].v,row('s3')[col('훈련참여수당(원)')].v,row('s3')[col('비고')].v],s1:[row('s1')[col('출석인정일수')].v,row('s1')[col('실출석일수')].v]};});
ok('엑셀 수당: s3 미달 · 0원',wb.s3[0]==='미달'&&wb.s3[1]===0,wb.s3);
ok('엑셀 수당: s1 인정 / 실출석 (오늘까지)',wb.s1[0]>=wb.s1[1],wb.s1);
console.log('ERRORS',JSON.stringify(errs));await b.close();})();
