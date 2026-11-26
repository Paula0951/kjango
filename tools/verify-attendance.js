#!/usr/bin/env node
// 출석 달력 검증: node tools/verify-attendance.js <shot-dir-name>
// 예시 데이터 → 월/주/하루/분석/모달 스크린샷, 주 시간표 끌어서 강사 넣기, 조퇴 50% 미만 → 결석 처리, xlsx 내보내기(OS 임시 폴더 out.xlsx)
// 시계는 2026-12-10 10:00(Asia/Seoul), 네트워크 차단. 끝에 ERRORS [] 이면 통과.
const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'shots',process.argv[2]||'attendance-adhoc'),SP=require('os').tmpdir();fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await chromium.launch();const errs=[];
  const ctx=await b.newContext({viewport:{width:1440,height:900},timezoneId:'Asia/Seoul',locale:'ko-KR',acceptDownloads:true});
  await ctx.route(/^(?!file:)/,r=>r.abort());
  const pg=await ctx.newPage();await pg.clock.install({time:new Date('2026-12-10T10:00:00+09:00')});
  pg.on('pageerror',e=>errs.push('pageerror '+e.message));pg.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
  await pg.goto('file://'+path.join(ROOT,'평일업무달력.html'));
  await pg.screenshot({path:OUT+'/admin-1440x900.png'});
  await pg.click('#app [data-mode=att]');await pg.waitForTimeout(100);
  await pg.screenshot({path:OUT+'/empty-1440x900.png'});
  await pg.click('[data-a=sample]');await pg.waitForTimeout(100);
  await pg.screenshot({path:OUT+'/month-all-1440x900.png'});
  await pg.click('#a-bar [data-a=track] >> nth=1');await pg.waitForTimeout(50);
  await pg.screenshot({path:OUT+'/month-track-1440x900.png'});
  // week view drag
  await pg.click('#a-bar [data-a=view][data-v=week]');await pg.waitForTimeout(50);
  const c1=pg.locator('[data-pc][data-di="1"][data-p="4"]'),c2=pg.locator('[data-pc][data-di="3"][data-p="6"]');
  const b1=await c1.boundingBox(),b2=await c2.boundingBox();
  await pg.mouse.move(b1.x+10,b1.y+10);await pg.mouse.down();await pg.mouse.move(b2.x+10,b2.y+10,{steps:5});await pg.mouse.up();
  console.log('selected',await pg.locator('.pc.sel').count());
  await pg.selectOption('#act-lec',{index:0});await pg.click('[data-a=aplec]');await pg.waitForTimeout(50);
  await pg.screenshot({path:OUT+'/week-1440x900.png',fullPage:true});
  // day modal
  await pg.click('#a-bar [data-a=view][data-v=month]');
  await pg.click('#a-grid .cell[data-k="2026-12-10"]');await pg.waitForTimeout(80);
  const sid=await pg.locator('#amodal [data-a=ast]').first().getAttribute('data-sid');
  await pg.click(`#amodal [data-a=ast][data-sid="${sid}"][data-s="조퇴"]`);
  for(const p of [3,4,5])await pg.click(`#amodal [data-a=ap][data-sid="${sid}"][data-p="${p}"]`);
  console.log('50% popup',await pg.locator('#apop').isVisible());await pg.screenshot({path:OUT+'/pop50-1440x900.png'});await pg.click('#apop [data-v=keep]');
  await pg.screenshot({path:OUT+'/day-1440x900.png'});
  await pg.keyboard.press('Escape');
  await pg.click('[data-a=open][data-m=stats]');await pg.click('#amodal [data-a=smode][data-v=all]');await pg.waitForTimeout(80);
  await pg.screenshot({path:OUT+'/stats-1440x900.png'});
  await pg.keyboard.press('Escape');
  for(const m of ['roster','lects','days','export','data']){await pg.click(`[data-a=open][data-m=${m}]`);await pg.waitForTimeout(60);await pg.screenshot({path:OUT+`/m-${m}-1440x900.png`});await pg.keyboard.press('Escape');}
  // export all with every sheet
  await pg.click('[data-a=open][data-m=export]');await pg.click('[data-a=exall]');
  for(const k of ['dsum'])await pg.check('#ex-'+k);
  const [dl]=await Promise.all([pg.waitForEvent('download'),pg.click('[data-a=exgo]')]);
  const f=SP+'/out.xlsx';await dl.saveAs(f);console.log('download',dl.suggestedFilename());
  // stats numbers check
  const st=await pg.evaluate(()=>{const T=window.__attTest;return T.A.students.map(s=>{const o=T.statStu(s,'2026-12-01','2026-12-31');return s.name+':'+[o.sd,o.att,o.yu,o.mu,o.low,o.ji,o.jo,o.gy,o.hw,o.abs,o.dd,o.cd].join(',');});});
  console.log(st.join('\n'));
  // mobile
  await pg.setViewportSize({width:400,height:800});await pg.keyboard.press('Escape');await pg.waitForTimeout(60);
  await pg.screenshot({path:OUT+'/month-400x800.png'});
  // back to admin and mode persistence
  await pg.click('#att [data-mode=admin]');console.log('mode',await pg.evaluate(()=>document.body.dataset.mode));
  await pg.reload();console.log('after reload mode',await pg.evaluate(()=>document.body.dataset.mode));
  console.log('ERRORS',JSON.stringify(errs));await b.close();
})();
