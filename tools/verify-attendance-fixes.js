#!/usr/bin/env node
// 리뷰 수정 회귀 테스트: node tools/verify-attendance-fixes.js  (모든 줄 PASS, ERRORS [] 이면 통과)
// 백업 복원(붙여넣기·파일), 지운 직종 필터 초기화, 통학+기숙 = 출석일, 조작된 백업 차단, 창 밖 드래그 종료, 파일 칸 놓기
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),os=require('os');const ROOT=path.resolve(__dirname,'..'),BK=path.join(os.tmpdir(),'att-bk.json');
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1440,height:900}});const errs=[];
pg.on('pageerror',e=>errs.push(e.message));await pg.clock.install({time:new Date('2026-12-10T10:00:00+09:00')});
await pg.goto('file://'+path.join(ROOT,'평일업무달력.html')+'?mode=att');await pg.click('[data-a=sample]');
const ok=(n,c)=>console.log((c?'PASS ':'FAIL ')+n);
// 3. dorm/commute days add up to 출석일
const r3=await pg.evaluate(()=>{const T=window.__attTest;return T.A.students.map(s=>{const o=T.statStu(s,'2026-12-01','2026-12-31');return [s.name,o.ra,o.dd+o.cd,o.hw];});});
ok('#3 통학+기숙 실출석 = 실출석일 '+JSON.stringify(r3.find(x=>x[0]==='김하늘')),r3.every(([,a,d])=>a===d));
// 2. stale track filters
await pg.click('[data-a=open][data-m=stats]');await pg.selectOption('#st-track',{index:1});await pg.keyboard.press('Escape');
await pg.click('#a-bar [data-a=clearex]');await pg.click('[data-a=sample]');
await pg.click('[data-a=open][data-m=stats]');const rows=await pg.locator('#amodal .atbl').first().locator('tbody tr').count();
const st=await pg.evaluate(()=>window.__attTest.au.stat.track);ok('#2 분석 필터 초기화 (rows='+rows+')',rows>3&&st==='');await pg.keyboard.press('Escape');
// 1. backup restore: paste path
const json=await pg.evaluate(()=>JSON.stringify(window.__attTest.A));
await pg.click('[data-a=open][data-m=data]');await pg.click('[data-a=arm][data-v=reset]');await pg.click('[data-a=reset]');
await pg.fill('#abk-in',json);await pg.click('[data-a=arm][data-v=imp]');
ok('#1 무장 후 붙여넣은 내용 유지',(await pg.inputValue('#abk-in')).length===json.length);
await pg.click('[data-a=imp]');ok('#1 붙여넣기 복원',await pg.evaluate(()=>window.__attTest.A.students.length)===8);
// 1. file path
fs.writeFileSync(BK,json);await pg.click('[data-a=arm][data-v=reset]');await pg.click('[data-a=reset]');
await pg.setInputFiles('#abk-file',BK);await pg.waitForTimeout(100);await pg.click('[data-a=arm][data-v=imp]');await pg.click('[data-a=imp]');
ok('#1 파일 복원',await pg.evaluate(()=>window.__attTest.A.students.length)===8);
// 4. malicious import
const evil=JSON.parse(json);evil.tracks.push({id:'x"><img src=x onerror=window.__pwn=1>',name:'악성'});evil.students[0].track='"><img src=x onerror=window.__pwn=1>';evil.offs[0].periods=['<b>',3,99];evil.lect['2026-12-01|'+evil.tracks[0].id]='notarray';
await pg.fill('#abk-in',JSON.stringify(evil));await pg.click('[data-a=arm][data-v=imp]');await pg.click('[data-a=imp]');
await pg.keyboard.press('Escape');for(const m of ['roster','days','lects','stats'])await pg.click(`[data-a=open][data-m=${m}]`).then(()=>pg.keyboard.press('Escape'));
const r4=await pg.evaluate(()=>{const A=window.__attTest.A;return {pwn:!!window.__pwn,tracks:A.tracks.length,t0:A.students[0].track,p:A.offs[0].periods};});
ok('#4 조작된 백업 차단 '+JSON.stringify(r4),!r4.pwn&&r4.tracks===3&&r4.t0===''&&JSON.stringify(r4.p)==='[3]');
await pg.click('[data-a=open][data-m=lects]');await pg.click('#amodal [data-a=arm][data-v^="l:"] >> nth=0');await pg.click('#amodal [data-a=ldel]');await pg.keyboard.press('Escape');ok('#4 강사 삭제 오류 없음',errs.length===0);
// 5. drag released outside window
await pg.click('#a-bar [data-a=view][data-v=week]');const c=pg.locator('[data-pc][data-di="0"][data-p="1"]'),bb=await c.boundingBox();
await pg.mouse.move(bb.x+5,bb.y+5);await pg.mouse.down();
await pg.evaluate(()=>{const t=document.querySelector('[data-pc][data-di="3"][data-p="5"]');t.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,buttons:0}));});
const n5=await pg.locator('.pc.sel').count();
await pg.evaluate(()=>{const t=document.querySelector('[data-pc][data-di="4"][data-p="6"]');t.dispatchEvent(new MouseEvent('mouseover',{bubbles:true,buttons:0}));});
ok('#5 버튼 뗀 뒤 선택 안 바뀜 (sel='+n5+')',n5===1&&await pg.locator('.pc.sel').count()===1);await pg.mouse.up();
// 6. drop on file input allowed in att mode
await pg.click('[data-a=open][data-m=data]');
const r6=await pg.evaluate(()=>{const f=document.getElementById('abk-file'),o=document.querySelector('#amodal .mh');const ev=t=>{const e=new DragEvent('dragover',{bubbles:true,cancelable:true});t.dispatchEvent(e);return e.defaultPrevented;};return [ev(f),ev(o)];});
ok('#6 파일 칸에는 놓기 허용, 다른 곳은 차단 '+JSON.stringify(r6),r6[0]===false&&r6[1]===true);
console.log('ERRORS',JSON.stringify(errs));await b.close();})();
