#!/usr/bin/env node
// 출석률·훈련수당 규칙 테스트: node tools/verify-attendance-rate.js  (모든 줄 PASS, ERRORS [] 이면 통과)
// 출석인정일수(유고 = 출석 인정) · 실출석일수(지각·조퇴·결과 날은 셈) · 환산결석 · 타 국비 종료일 · 80% 판정
// 훈련참여수당(정액/일할/상한/직접 지정) · 교통비(통학인 날 실출석, 유고 없음) · 통학·기숙 변경 이력 · 50% 미만 안내창 · 학생별 화면 · 엑셀
// 시계 2026-12-10 10:00. 2026년 12월 소정일 = 12/1–12/18 평일 14일 (12/21부터 동계 방학) → 일할. 2027년 1월 단위기간은 방학 뒤 1/11부터
const {chromium}=require('playwright');const path=require('path');const ROOT=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];
pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await pg.clock.install({time:new Date('2026-12-10T10:00:00+09:00')});
await pg.goto('file://'+path.join(ROOT,'평일업무달력.html')+'?mode=att');
const ok=(n,c,x)=>console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?' '+JSON.stringify(x):''));
const r=await pg.evaluate(()=>{const T=window.__attTest;
  const st=(id,o)=>Object.assign({id,name:id,track:'t1',no:'',admit:'2026-12-01',complete:'',commute:'Y',cnp:'N',memo:''},o||{});
  const A={tracks:[{id:'t1',name:'용접'}],att:{},students:[st('s1'),st('s2',{govEnd:'2026-12-04'}),st('s3'),st('s4'),st('s5'),st('s6',{govEnd:'2026-12-31'}),
    st('s7',{moves:[{d:'2026-12-07',t:'D'}]}),st('s8'),st('s9'),st('c1',{cnp:'Y'}),st('d1',{dorm:'2026-12-14'})]};
  const put=(id,d,s,p)=>A.att['2026-12-'+d+'|'+id]=p?{s,p}:{s};
  put('s1','01','유고결석');put('s1','02','유고결석');put('s1','03','무단결석');['04','07','08','09'].forEach(d=>put('s1',d,'지각',[1]));
  put('s2','02','무단결석');put('s2','07','무단결석');/* 12/2는 타 국비 기간 → 안 셈 */
  ['01','02','03','04','07'].forEach(d=>put('s3',d,'무단결석'));['01','02','03','04','07'].forEach(d=>put('c1',d,'무단결석'));
  ['01','02'].forEach(d=>put('s4',d,'무단결석'));put('s8','02','유고결석');
  T.A=A;const S=id=>T.A.students.find(s=>s.id===id),dec={y:2026,m:11},jan={y:2027,m:0},feb={y:2027,m:1};
  const o=T.statStu(S('s1'),'2026-12-01','2026-12-31'),risk=id=>{const x=T.unitRisk(S(id),dec);return x&&[x.st,x.sd,x.need,x.left,x.pend];};
  const pay=(id,m)=>{const p=T.payStu(S(id),m);return p&&[p.type,p.part,p.fare,p.total,p.o.ra,p.o.cd];};
  const out={s1:[o.sd,o.ia,o.ra,o.yu,o.mu,o.ji,o.hw,o.abs,Math.round(o.rate*1e4)/1e4,o.cd+o.dd],s2:T.statStu(S('s2'),'2026-12-01','2026-12-31'),
    r:{s1:risk('s1'),s3:risk('s3'),s4:risk('s4'),s5:risk('s5'),s6:risk('s6')},
    p:{s5:pay('s5',dec),s3:pay('s3',dec),s7:pay('s7',dec),s8:pay('s8',dec),c1:T.payStu(S('c1'),dec),s5f:pay('s5',feb)},
    jan:T.unitInfo(S('s5'),jan),feb:T.unitInfo(S('s5'),feb),d1:S('d1').moves};
  const fsd=out.p.s5f[4];T.A.unitType['2027-02|s5']='pro';const A2=JSON.parse(JSON.stringify(T.A));T.A=A2;out.s5fo=pay('s5',feb);out.fsd=fsd;
  T.A.pay.cap=120000;out.cap=pay('s5',dec);T.A.pay.cap=200000;
  return out;});
ok('s1 소정14 · 인정12 · 실출석11 (지각 날은 셈) · 유고2 · 무단1 · 지각4 · 환산1 · 결석계2 · 12/14',JSON.stringify(r.s1)===JSON.stringify([14,12,11,2,1,4,1,2,0.8571,11]),r.s1);
ok('s2 타 국비 12/4 종료 → 소정 10, 12/2 무단은 안 셈',r.s2.sd===10&&r.s2.mu===1&&r.s2.ia===9,[r.s2.sd,r.s2.mu,r.s2.ia]);
ok('판정: s1 위험 · s3 미달 · s4 위험 · s5 충족 · s6 없음',r.r.s1[0]==='warn'&&r.r.s3[0]==='fail'&&r.r.s4[0]==='warn'&&r.r.s5[0]==='ok'&&r.r.s6===null,r.r);
ok('12월(방학 있음) s5 일할: 14일 × 10,000 = 140,000 + 교통비 14 × 2,500',JSON.stringify(r.p.s5)===JSON.stringify(['pro',140000,35000,175000,14,14]),r.p.s5);
ok('s3 80% 미달 → 참여수당·교통비 0원',r.p.s3[1]===0&&r.p.s3[2]===0,r.p.s3);
ok('s7 12/7 기숙사 입소 → 교통비는 통학 4일만',r.p.s7[5]===4&&r.p.s7[2]===10000,r.p.s7);
ok('s8 유고결석 날은 교통비 없음 (출석률은 100%)',r.p.s8[5]===13&&r.p.s8[2]===32500,r.p.s8);
ok('취성패 c1: 수당 계산 안 함, 판정은 있음',r.p.c1.part===null&&r.p.c1.total===null&&r.p.c1.risk.st==='fail');
ok('1월: 방학 뒤 1/11부터 단위기간 · 일할',r.jan.first==='2027-01-11'&&r.jan.partial&&r.jan.why.join()==='방학',r.jan);
ok('2월: 그 달 전체 → 정액 200,000',!r.feb.partial&&r.p.s5f[0]==='full'&&r.p.s5f[1]===200000,r.p.s5f);
ok('2월 일할로 직접 지정 → min(상한, 실출석 × 10,000), 백업에도 남음',r.s5fo[0]==='pro'&&r.s5fo[1]===Math.min(200000,r.fsd*10000),r.s5fo);
ok('일할 상한 120,000 적용',r.cap[1]===120000,r.cap);
ok('예전 기숙사 입소일 → 변경 이력으로 옮김',JSON.stringify(r.d1)==='[{"d":"2026-12-14","t":"D"}]',r.d1);
// 화면: 학생별
await pg.click('#att [data-mode=admin]');await pg.click('#app [data-mode=att]');
await pg.click('#a-bar [data-a=view][data-v=stu]');
const nrow=await pg.locator('#a-body table.atbl tbody tr').count();ok('학생별 표: 12월 재적 10명 (s6 제외)',nrow===10,nrow);
const c1row=await pg.locator('#a-body tr.cnp').innerText();ok('취성패 줄: 계산 안 함',/계산 안 함/.test(c1row));
const sum=await pg.locator('#a-body .sv-sum').innerText();ok('위쪽 합계 줄',/훈련참여수당/.test(sum)&&/교통비/.test(sum),sum.replace(/\s+/g,' '));
// 학생 카드: 통학·기숙 변경 추가, 계산 방식 지정
await pg.click('#a-body [data-a=stu][data-id=s5]');ok('학생 카드 열림',await pg.locator('#amodal #mv-d').count()===1);
await pg.fill('#mv-d','2026-12-14');await pg.selectOption('#mv-t','D');await pg.click('[data-a=mvadd]');
const f5=await pg.evaluate(()=>{const T=window.__attTest;const p=T.payStu(T.A.students.find(s=>s.id==='s5'),{y:2026,m:11});return [p.o.cd,p.fare];});
ok('12/14 기숙사 입소 → 12월 교통비 통학 9일',f5[0]===9&&f5[1]===22500,f5);
await pg.selectOption('#ut-2026-12','full');
const t5=await pg.evaluate(()=>{const T=window.__attTest;return [T.A.unitType['2026-12|s5'],T.payStu(T.A.students.find(s=>s.id==='s5'),{y:2026,m:11}).part];});
ok('12월 정액으로 지정 → 200,000',t5[0]==='full'&&t5[1]===200000,t5);
await pg.keyboard.press('Escape');
// 50% 미만 안내창
await pg.click('#a-bar [data-a=view][data-v=month]');await pg.click('#a-grid .cell[data-k="2026-12-10"]');
await pg.click('#amodal [data-a=ast][data-sid=s9][data-s="지각"]');
for(const p of [2,3])await pg.click(`#amodal [data-a=ap][data-sid=s9][data-p="${p}"]`);
ok('출석 3/6 (50%) → 안내창 없음',await pg.locator('#apov').isHidden());
await pg.click('#amodal [data-a=ap][data-sid=s9][data-p="4"]');
ok('출석 2/6 → 안내창',await pg.locator('#apop').isVisible()&&/50% 미만/.test(await pg.locator('#apop').innerText()));
ok('지각은 그대로 (자동으로 안 바뀜)',await pg.evaluate(()=>window.__attTest.A.att['2026-12-10|s9'].s)==='지각');
await pg.keyboard.press('Escape');ok('Esc = 그대로 두기, 하루 창은 열린 채',await pg.locator('#apov').isHidden()&&await pg.locator('#aov').isVisible());
ok('줄에 50% 미만 표시 + 처리하기',await pg.locator('#amodal .res.warn [data-a=p50open][data-sid=s9]').count()===1);
await pg.click('#amodal [data-a=p50open][data-sid=s9]');await pg.click('#apop [data-a=p50][data-v="무단결석"]');
ok('무단결석으로 바꿈',await pg.evaluate(()=>window.__attTest.A.att['2026-12-10|s9'].s)==='무단결석'&&await pg.locator('#apov').isHidden());
await pg.keyboard.press('Escape');
// 엑셀
const wb=await pg.evaluate(()=>{const T=window.__attTest,sh=T.buildWorkbook({from:0,to:0,track:'',upto:1,sh:{allow:1}});
  const al=sh.find(s=>s.name==='훈련수당 계산'),hi=al.rows.findIndex(r=>r[0]&&r[0].v==='직종'),h=al.rows[hi].map(c=>c.v),row=n=>al.rows.find(r=>r[1]&&r[1].v===n),col=l=>h.indexOf(l);
  return {s3:[row('s3')[col('80% 판정')].v,row('s3')[col('훈련수당 합계')].v],s8:[row('s8')[col('교통비')].v,row('s8')[col('계산 방식')].v],c1:row('c1')[col('훈련참여수당')].v,tot:!!al.rows.find(r=>r[0]&&r[0].v==='합계')};});
ok('엑셀: s3 미달 0원 · s8 교통비 32,500 일할 · 취성패 빈칸 · 합계 줄',wb.s3[0]==='미달'&&wb.s3[1]===0&&wb.s8[0]===32500&&wb.s8[1]==='일할'&&wb.c1===''&&wb.tot,wb);
console.log('ERRORS',JSON.stringify(errs));await b.close();})();
