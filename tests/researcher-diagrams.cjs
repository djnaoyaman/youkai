const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.TEST_BASE||'http://127.0.0.1:8765/';
const expected={
 'yanagita-kunio':3,'komatsu-kazuhiko':2,'inoue-enryo':2,
 'origuchi-shinobu':3,'miyata-noboru':3,'sasaki-kizen':2
};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH});
 try{
  const c=await b.newContext({reducedMotion:'reduce'});
  await c.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
  await c.addInitScript(()=>sessionStorage.setItem('youkai-brand-seen','1'));
  const p=await c.newPage();
  for(const width of [320,390,768,1440]){
   await p.setViewportSize({width,height:900});
   for(const [slug,count] of Object.entries(expected)){
    const response=await p.goto(base+slug+'.html#research-method',{waitUntil:'domcontentloaded'});
    assert.equal(response.status(),200);
    const f=p.locator('figure#research-method');
    assert.equal(await f.count(),1,slug);
    assert.equal(await f.locator('.research-viz-nodes > li').count(),count,slug);
    assert.equal(await f.getByRole('link').count(),1,slug);
    if(slug==='inoue-enryo') assert.deepEqual(await f.locator('dt').allTextContents(),['偽怪','誤怪','仮怪','真怪']);
    const box=await f.evaluate(el=>({w:el.getBoundingClientRect().width,inner:innerWidth,cols:getComputedStyle(el.querySelector('.research-viz-nodes')).gridTemplateColumns.split(' ').length,
       valid:[...el.querySelectorAll('li svg')].every(i=>i.getAttribute('aria-hidden')==='true'),scroll:document.documentElement.scrollWidth}));
    assert.equal(box.cols,width<=580?1:count,slug);
    assert.ok(box.w>0&&box.w<=760&&box.scroll<=box.inner+1&&box.valid,slug);
   }
  }
  await p.setViewportSize({width:320,height:900});
  await p.goto(base+'inoue-enryo.html#research-method');
  if(process.env.SCREENSHOT)await p.locator('#research-method').screenshot({path:process.env.SCREENSHOT});
  console.log('PASS: six sourced diagrams over four viewport widths; four Inoue categories keep their proper groups.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
