const {chromium}=require('playwright');
const assert=require('node:assert/strict'); const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});fs.mkdirSync('test-artifacts/brand',{recursive:true});const results=[];
try{
 for(const [width,height] of [[320,780],[390,844],[768,1024],[1280,900],[844,390]]){
  const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.goto('http://127.0.0.1:8765/index.html'); await page.locator('.brand-loading').waitFor({state:'detached'});
  assert.equal(await page.locator('.nav-toggle').isVisible(),true);assert.equal(await page.locator('.brand-logo').getAttribute('alt'),'一見坊の【日本妖怪学体系】');
  await page.screenshot({animations:'disabled',path:`test-artifacts/brand/home-${width}.png`});
  for(let i=0;i<3;i++){
   await page.locator('#navToggle').click();assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'true');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'navClose');
   await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.className),'nd-link');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'navClose');
   if(i===0) await page.screenshot({animations:'disabled',path:`test-artifacts/brand/menu-${width}.png`});
   await page.keyboard.press('Escape');assert.equal(await page.locator('#navDrawer').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'navToggle');
  }
  await page.evaluate(()=>scrollTo(0,600)); const savedY=await page.evaluate(()=>scrollY);
  await page.locator('#navToggle').evaluate(el=>el.click());assert.equal(await page.evaluate(()=>document.body.style.position),'fixed');
  await page.keyboard.press('Escape');assert.ok(Math.abs(await page.evaluate(()=>scrollY)-savedY)<2,'scroll restored');
  await page.locator('#navToggle').click();await page.locator('#navDrawer .nd-link').first().click();await page.waitForURL('**/zukan.html');
  await page.goBack();assert.equal(await page.locator('#navDrawer').isVisible(),false);assert.equal(await page.locator('.brand-loading').count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);
  await page.goto('http://127.0.0.1:8765/yokai/kappa.html');assert.equal(await page.locator('.brand-loading').count(),0);await page.locator('#navToggle').click();await page.locator('#navClose').click();
  results.push({width,height,passed:true});await context.close();
 }
 for(const javaScriptEnabled of [false,true]){
  const context=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled});const page=await context.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).hostname!=='127.0.0.1'||(javaScriptEnabled&&r.request().resourceType()==='script')?r.abort():r.continue());
  await page.goto('http://127.0.0.1:8765/index.html');await page.locator('#navFallback summary').click();assert.equal(await page.locator('#navDrawer .nd-link').first().isVisible(),true);
  assert.equal(await page.locator('.reveal').first().evaluate(el=>getComputedStyle(el).opacity),'1');await page.screenshot({animations:'disabled',path:`test-artifacts/brand/fallback-${javaScriptEnabled}.png`});await context.close();
 }
 for(const reducedMotion of ['reduce','no-preference']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion});const page=await context.newPage();let release;const hold=new Promise(r=>release=r);
  await page.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1')return r.abort();if(r.request().url().endsWith('parallax-beach.jpg'))await hold;return r.continue();});
  await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.brand-loading').count(),1);assert.equal(await page.locator('.brand-loading').getAttribute('aria-hidden'),'true');assert.equal(await page.locator('.brand-loading').evaluate(el=>getComputedStyle(el).pointerEvents),'none');
  assert.equal(await page.locator('.brand-loading').evaluate(el=>getComputedStyle(el).animationName),reducedMotion==='reduce'?'none':'brand-breathe');await page.locator('.brand-loading img').evaluate(img=>img.decode());const cdp=await context.newCDPSession(page);fs.writeFileSync(`test-artifacts/brand/loading-${reducedMotion}.png`,Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png'})).data,'base64'));await cdp.detach();if(reducedMotion==='reduce'){await page.waitForTimeout(5200);assert.equal(await page.locator('.brand-loading').count(),0,'timeout safety');}release();await page.waitForLoadState('load');assert.equal(await page.locator('.brand-loading').count(),0);await context.close();
 }
 fs.writeFileSync('test-artifacts/brand/results.json',JSON.stringify(results,null,2));console.log('Brand, menu, fallback, reduced-motion and genuine-load tests passed',results);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
