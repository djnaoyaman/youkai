const {chromium}=require('playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});const results=[];fs.mkdirSync('test-artifacts/header-name',{recursive:true});
try{for(const width of [320,375,390,402,430,768,1280]){for(const scale of [1,2]){
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 await page.goto('http://127.0.0.1:8765/index.html');
 if(scale===2)await page.locator('nav.topnav, nav.topnav *').evaluateAll(els=>{const sizes=els.map(el=>parseFloat(getComputedStyle(el).fontSize));els.forEach((el,i)=>el.style.fontSize=(sizes[i]*2)+'px');});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const geometry=await page.evaluate(()=>{
  const title=document.querySelector('.brand-title'),prefix=document.querySelector('.brand-prefix'),nav=document.querySelector('.topnav'),button=document.querySelector('#navToggle'),brand=document.querySelector('.brand');
  const r=el=>{const q=el.getBoundingClientRect();return {x:q.x,y:q.y,right:q.right,bottom:q.bottom,width:q.width,height:q.height};};
  const range=document.createRange();range.selectNodeContents(title);const lines=Array.from(range.getClientRects()).filter(q=>q.width>0).map(q=>({top:q.top,left:q.left,right:q.right}));
  return {title:r(title),prefix:r(prefix),nav:r(nav),button:r(button),brand:r(brand),lines,bodyPadding:parseFloat(getComputedStyle(document.body).paddingTop),navHeight:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--navh')),name:document.querySelector('.brand-name').textContent,overflow:document.documentElement.scrollWidth>innerWidth+1,font:parseFloat(getComputedStyle(title).fontSize)};
 });
 assert.equal(geometry.name,'一見坊の【日本妖怪学体系】');assert.equal(new Set(geometry.lines.map(q=>Math.round(q.top))).size,1,'complete book title stays on one line');
 assert.ok(geometry.title.x>=0&&geometry.title.right<=width+1,'title fully inside viewport');assert.ok(geometry.title.right<=geometry.button.x+1||geometry.title.y>=geometry.button.bottom-1,'title does not overlap hamburger');
 assert.ok(geometry.button.width>=44&&geometry.button.height>=44,'accessible hamburger hit target');assert.equal(geometry.overflow,false);assert.ok(geometry.nav.height<240,'header remains usable at doubled text');
 if(width<=900)assert.ok(Math.abs(geometry.navHeight-geometry.nav.height)<2,'fixed header offset tracks enlarged text');
 await page.screenshot({path:`test-artifacts/header-name/header-${width}-${scale}x.png`,animations:'disabled'});
 await page.locator('#navToggle').click();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>document.activeElement.id),'navToggle');assert.deepEqual(errors,[]);
 results.push({width,textScale:scale,...geometry,errors});await page.close();
}}}finally{fs.writeFileSync('test-artifacts/header-name/results.json',JSON.stringify(results,null,2));await browser.close();}
console.log('Header semantic units and 200% text checks passed',results.map(r=>({width:r.width,textScale:r.textScale,titleLines:r.lines.length,headerHeight:r.nav.height})));
})().catch(e=>{console.error(e);process.exit(1)});
