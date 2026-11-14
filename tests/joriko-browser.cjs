const {chromium}=require('playwright');const assert=require('node:assert/strict');const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH});
 fs.mkdirSync('/tmp/joriko-qa',{recursive:true});
 try{for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await page.goto('http://127.0.0.1:8765/joriko.html');
  assert.notEqual(await page.locator('#jrk-wealth').innerText(),'—');
  assert.equal(await page.locator('#jrk-wins-row').isDisabled(),true);
  assert.equal(await page.locator('#jrk-charts svg').count(),3);
  assert.equal(await page.locator('#jrk-charts tbody tr').count(),41);
  const initial=await page.locator('#jrk-trust').innerText();
  await page.locator('#jrk-agency').fill('100');await page.locator('#jrk-agency').dispatchEvent('input');
  assert.equal(await page.locator('#jrk-trust').innerText(),initial);
  await page.locator('[data-preset="burden"]').click();await page.locator('#jrk-repair').check();
  assert.equal(await page.locator('#jrk-repair-comparison').isVisible(),true);
  const before=await page.locator('#jrk-repair-body tr').nth(1).locator('td').allTextContents();
  assert.ok(Number(before[1])>Number(before[0]));
  await page.locator('[name="jrkCareer"][value="founder"]').check();
  assert.equal(await page.locator('#jrk-wins-row').isDisabled(),false);
  await page.locator('[name="jrkWins"][value="5"]').check();await page.locator('#jrk-crash').check();
  assert.equal(await page.locator('#jrk-crash-comparison').isVisible(),true);
  assert.equal(await page.locator('#jrk-charts svg path').count(),16);
  await page.locator('.jrk-details').first().locator('summary').click();
  await page.locator('#jrk-weight-preset').selectOption('economic');
  assert.match(await page.locator('#jrk-weight-note').innerText(),/経済60.0%/);
  for(const id of ['related','autonomy','economic'])await page.locator('#jrk-weight-'+id).fill('0');
  assert.match(await page.locator('#jrk-weight-note').innerText(),/関係40.0%/);
  await page.locator('#jrk-agency').focus();await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('#jrk-agency').inputValue(),'75');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`overflow at ${width}`);
  await page.screenshot({path:`/tmp/joriko-qa/${width}.png`,fullPage:true});
  assert.deepEqual(errors,[]);
  await page.locator('[data-preset="balanced"]').click();
  assert.equal(await page.locator('#jrk-repair-comparison').isVisible(),false);
  assert.equal(await page.locator('#jrk-crash-comparison').isVisible(),false);
  assert.equal(await page.locator('#jrk-agency').inputValue(),'50');
  assert.equal(await page.locator('#jrk-trust').innerText(),initial);
  await page.close();
 }console.log('PASS: four viewport sizes, all controls, repair/crash comparisons, weights, 41 rows, keyboard, reset and no JS errors');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
