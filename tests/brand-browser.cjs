const {chromium}=require('playwright');
const assert=require('node:assert/strict'); const fs=require('node:fs');
require('node:child_process').execFileSync('python3',['tests/kaidan-illustrations.py'],{stdio:'inherit'});
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
  for(const slowPage of [false,true]){
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion});const page=await context.newPage();let release;const hold=new Promise(r=>release=r);
   await page.addInitScript(()=>{
    window.introTimes={};
    new MutationObserver(()=>{
     const visible=!!document.querySelector('.brand-loading');
     if(visible&&introTimes.start===undefined)introTimes.start=performance.now();
     if(!visible&&introTimes.start!==undefined&&introTimes.end===undefined)introTimes.end=performance.now();
    }).observe(document,{childList:true,subtree:true});
   });
   await page.route('**/*',async r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1')return r.abort();if(slowPage&&r.request().url().endsWith('parallax-beach.jpg'))await hold;return r.continue();});
   await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('.brand-loading').count(),1);
   assert.equal(await page.locator('.brand-loading').getAttribute('aria-hidden'),'true');
   const cover=await page.locator('.brand-loading').evaluate(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return {x:r.x,y:r.y,w:r.width,h:r.height,pointer:s.pointerEvents,bg:s.backgroundColor};});
   assert.deepEqual(cover,{x:0,y:0,w:390,h:844,pointer:'auto',bg:'rgb(250, 250, 247)'});
   assert.equal(await page.locator('.topnav').evaluate(el=>getComputedStyle(el).visibility),'hidden');
   assert.equal(await page.locator('.brand-loading img').evaluate(el=>getComputedStyle(el).animationName),reducedMotion==='reduce'?'none':'brand-breathe');
   await page.locator('.brand-loading img').evaluate(img=>img.decode());
   const cdp=await context.newCDPSession(page);fs.writeFileSync(`test-artifacts/brand/loading-${reducedMotion}-${slowPage}.png`,Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png'})).data,'base64'));await cdp.detach();
   // Inputs, including a programmatic menu click, must not shorten the intro.
   await page.evaluate(()=>{dispatchEvent(new Event('pointerdown'));dispatchEvent(new Event('scroll'));dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));document.getElementById('navToggle').click();});
   await page.waitForTimeout(1000);assert.equal(await page.locator('.brand-loading').count(),1,'intro survives load and input');
   await page.locator('.brand-loading').waitFor({state:'detached',timeout:5000});
   const elapsed=await page.evaluate(()=>introTimes.end-introTimes.start);assert.ok(elapsed>=2000&&elapsed<4000,`intro lasted ${elapsed}ms`);
   assert.equal(await page.locator('.topnav').evaluate(el=>getComputedStyle(el).visibility),'visible');
   assert.equal(await page.locator('#navToggle').getAttribute('aria-expanded'),'false');
   if(slowPage)assert.notEqual(await page.evaluate(()=>document.readyState),'complete','intro ends without waiting for the page');
   release();await page.waitForLoadState('load');
   await page.reload();assert.equal(await page.locator('.brand-loading').count(),0,'reload in the same session does not replay');
   if(!slowPage){
    // A ready/cached document must still play the full intro in a fresh session.
    await page.evaluate(()=>sessionStorage.removeItem('youkai-brand-seen'));
    await page.addScriptTag({url:'http://127.0.0.1:8765/brand-ui.js?ready-document'});
    assert.equal(await page.locator('.brand-loading').count(),1,'ready document still plays intro');
    await page.waitForTimeout(1000);assert.equal(await page.locator('.brand-loading').count(),1);
    await page.locator('.brand-loading').waitFor({state:'detached',timeout:5000});
   }
   await context.close();
  }
 }
 // Illustration releases must preserve the story seams and decode their own real WebP
 // in phone and desktop layouts. Check the first and newest published story.
 const artFiles=fs.existsSync('assets/kaidan')?fs.readdirSync('assets/kaidan').filter(name=>/^\d{3}-[a-z]+\.webp$/.test(name)).sort():[];
 for(const filename of new Set(artFiles.length?[artFiles[0],artFiles.at(-1)]:[])){
  const slug=filename.slice(4,-5);
  for(const width of [320,390,1280]){
   const context=await browser.newContext({viewport:{width,height:820},reducedMotion:'reduce'});
   try{
    const page=await context.newPage();
    await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    const imageResponse=page.waitForResponse(res=>res.url().endsWith('/'+filename));
    await page.goto('http://127.0.0.1:8765/kaidan/'+slug+'.html',{waitUntil:'domcontentloaded'});
    const figure=page.locator('figure.kaidan-illustration');
    assert.equal(await figure.count(),1);
    await figure.scrollIntoViewIfNeeded();
    const response=await imageResponse;
    assert.equal(response.status(),200);
    assert.match(response.headers()['content-type'],/^image\/webp(?:$|;)/);
    const dimensions=await figure.evaluate(async (el)=>{
     const img=el.querySelector('img');await img.decode();const box=img.getBoundingClientRect();
     return {native:[img.naturalWidth,img.naturalHeight],hint:[img.width,img.height],
      box:[box.left,box.right,box.width,box.height],head:el.previousElementSibling.className,
      body:el.nextElementSibling.className,viewport:innerWidth};
    });
    assert.ok(dimensions.box[0]>=0&&dimensions.box[1]<=dimensions.viewport);
    assert.ok(Math.abs(dimensions.box[2]/dimensions.box[3]-4/3)<0.01);
    assert.ok(Math.abs(dimensions.native[0]/dimensions.native[1]-4/3)<0.01);
    assert.equal(dimensions.head,'record-head');assert.equal(dimensions.body,'record-body');
    if(width===390)await figure.screenshot({path:'test-artifacts/brand/kaidan-'+slug+'.png'});
   }finally{await context.close();}
  }
 }
 fs.writeFileSync('test-artifacts/brand/results.json',JSON.stringify(results,null,2));console.log('Brand, menu, fallback, reduced-motion and two-second session-intro tests passed',results);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
