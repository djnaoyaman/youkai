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
 // Preserve keyboard-first access and the first academic diagram across page types.
 {
  const context=await browser.newContext({viewport:{width:1440,height:950},reducedMotion:'reduce'});
  await context.addInitScript(()=>sessionStorage.setItem('youkai-brand-seen','1'));
  const page=await context.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  for(const slug of ['index.html','essay.html','yokai/kappa.html','gendai/akegata-baba.html','kaidan/shamisen.html','shin-tono/kaeru-hi.html','kamakura-taxi-kaidan-01.html','404.html']){
   await page.goto('http://127.0.0.1:8765/'+slug,{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('.content-skip-link').count(),1,slug);
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.className),'content-skip-link',slug);
   await page.keyboard.press('Enter');
   assert.ok(await page.evaluate(()=>document.activeElement.classList.contains('content-skip-target')),slug);
  }
  for(const width of [320,390,768,1440,1920]){
   await page.setViewportSize({width,height:920});
   await page.goto('http://127.0.0.1:8765/essay.html',{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#yokai-three-levels li').count(),3);
   assert.equal(await page.locator('#yokai-three-levels ol').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<=580?1:3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await context.close();
 }
 // Fetch and decode each illustration in a mobile viewport. For the first and
 // newest in each format, also check narrow/desktop layout and the reserved space.
 const reviewedBodyReadings={"fumitsukai":[25,"6e6776502036dc6871aed0be2b9401811121d02e42b0690f195089d8c2953a7b","d864a9fa6a2baaadffe500d10c229c288388fded63ac066708ed463002290495"],"shamisen":[13,"61b5d5679a63d86aad77330230c4388dab665c14c0a25bb70e2ed4cdb10df565","be59e189ae0b84211ece3462dbf7b4a7acd57a86dca570150a03ad1e6546bfb8"],"yuya":[15,"1ed09703601a4015467c070aa80a287a04077dce1cb76175035a503876fb2510","96b6efb3ab0058fdc25faf21c5aa8c67f034cb9da1e0169b7ed13c15308fe8b3"],"sonryoya":[23,"3a6875bae3485713974eac13ebc52b697a69a4b21fe6d53c681166ff5bb77848","9917c9d2cd722681f94e1d21407bd76c1217aee4a0c6799ef10234987026333e"],"kamiyui":[7,"a0bab207d7b2ddb30012db0e27b5062e6abe52a4932b4d88eb48fa8bde93e6b5","1cf452dddbc11499030c6a49faa5a434609d74308a276a038eb606a6646c049d"],"sobayatai":[24,"e7b9796f82bad9259d244fe426658e103ed84a2062c0edee8f30361c39db5451","466ed41214ee798ada32e52d49c0131720251c998add63ea7a12970ec656152d"],"shichiya":[18,"df4de86677ee8077a4183717e9538962ff2e82c5a6af574d5100fe07b3f70cdd","293b9fcbe153a02f3bf16cb1fe431535339379c8fb1b96c13f68a1a5d5ba8184"],"hanabishi":[16,"daaa6f3b85fe8f0d694eddecb560a97173a0cae5fa28dbc09a71a6d00e31b9b3","cc4b0cc9a8a7fb4133f8e2cb90e4374d425d0d4e891c7c8a5e407b1b6eb0dac5"],"uwasa":[18,"728b69b6ec23772fecafcbce4407d5ceaaf3581e7d617796da00021e5240d1ff","08bf4395026a88152dfa8b3bff0c949ae86620bb66cb9987be7550dad6482f2f"],"hanami":[5,"37c24bbba354eb16ee8fbe958f5a6b569dca179decb80692c101cedd98b89b4d","1eee4d1fbf6c3938a81d7a659409b58975b972cf131ba97463eedd1fe30da4d8"],"kawatare":[17,"18c911617f4a0fbcac9c1f68dc71a65b45d2db92f9a4935cae22d882205ec484","74296e59210b7cc0f2c9b840cfda580092b2e2057e039c2345ab47145bd60025"],"mojiuri":[22,"8950ed7b248993d9d194ca0b76f3844f66741503ccad4c3aa290517a1bdcf4a8","d9d26f81757c8e9e2f28baccb2bb3d63f8039ae7c5dc8d8d77c9a6cda70c2108"],"sanninshogen":[14,"cf66d90e5ba08162b5125f161804eb571c0625f61575401ec855cabd98aa084d","5c81b17861c5c2e82c0f23109d61266e11125a806efeeb8286030cb62e1385b7"],"egusashi":[10,"972fcf50928742e8d4b1cbae1423589ad9e0611ec1a1b6ac03891d1cd52f0ba3","8dbd70cda6055f869f8af1f60586f77853248031275c70b354ea5183887ec329"],"atowoouotoko":[11,"e6ffaa44ed2cd1119eb45e7999ee36f4f67310467c767152a9d53fa437e876c7","a4d356e39f77f8a3a8273a0154abc21beca0e80bd239dc59d7e2f31435d51069"],"shakkintori":[21,"d682a79bf68483a60ebb24b940afdb687f20760ea6f0bd1843ce1523762be506","ac1db788be0af1b6e55737d3575813de635f952fcd8d17e111d67bf8a6f3683c"],"iwainohi":[15,"e9d2afe9618624f3eced6f4ca9b950517fe7d479451fc01da3ebd5d481a0a499","ed8bf19fe549b9df062fc5c1d69cfe7fe96377a5e7e4ddaf154ea5a3d8741c1c"],"sainome":[10,"cd6c57730bdbffbdc69b61d03a72260a01d7ca4f5c8210ca13db7d99595ff21d","856e137db6925c7186d1b58e6973ca6951d161f01877600472665f20b5969eb3"],"ouraikippu":[8,"730becf58db15bf9176995b33c34d1f855db0417056977bd8e2aa57e23bb86df","8383f0c59f3b87564929a4e1ec22d73538fe46cda2a7176270ddf67a28e18c61"],"hakononaka":[5,"48df5601911e56ff266b72ee90b5b8b0c2278de0b60133e710ee5ad161bb6a12","1818a6e5235c3ac3aa3ff929f0e85f038fd8b698cc5c6dea54c1bf95fd1eb0dc"],"kagenobundake":[21,"a54bd8190850853fa934988e572d4908eaf00abd2d460940e4c848d0166c21fe","7f887b46c428dfc29d926c9c510d3fd6d9c867c6e8c245e37e10f9617103af4d"],"yoban":[17,"ed58877f20e24d7ef3983915b5eb77e9e9a230523d59715c34a356807fe2a5b3","bea5eca31b3f4034d9c9a92b2c4722e3dc622525bac6d59620cce627a9320a64"],"futagonohashi":[4,"d454fe1468a299d5466e0080fbb896b30dba9f2c1a9cd8bfa1692af93b46daf5","2b8288ee578e30e720362bfc609d9862335eb1fa2fb9c396e2d911d4f931bca2"],"saigonokyaku":[12,"c20a28a0a70081e0ea324205f3c281f06f608cf9b9e75df51d2240abf962da50","84e89d0475ff38555f796ff4b71906b8ab6d9601dfca433b0d3f47faaf7e96a2"],"hyakumonogatarinoato":[12,"96196bbc6cc637bd118eee8fd7f00b343cd679da7ee02f3eb89b965f8481021b","2e941f4577166136e9b4304fc906d8cd5f3b435e4e0d4b2f28f9dfeaafec3e06"],"yakushae":[5,"d7c1444328c1bd9a5e4fb5a3cc41a59c0116da832612a73f06ff5d6613a8fff4","10663099734a096268eb5453f04a4cc308f80c72b9ed836498b2bbc1a2bf56fb"],"mittsunonegai":[8,"4581d316648fb64f2a379fd3a8641935c5d09dcc839ab11315f612933c215abd","f49db58289f5b34947202ad84c60ed59ffc10e1c92c1f79dc85888f279b53037"],"ryousainokyaku":[7,"0f253137832f7280e2d46a423d4336188328137933e88fa8356b36e026113b24","ee71f7ca0da865d1871b929aee124bcf23c012ea2b9ee69e2ed354dfb989fda8"],"noumennoonna":[20,"8c879dadbaab30f2b79c4a8b7275477fd1664fc057b36f71f1dec07b0d9d078e","002e371d95284ee467d6260dec4b2f9b279b63dff71768ff6841c798496fd97e"],"mitsugonosanba":[5,"d02cf3fa9ee267368d8dce480a3a39ffa3b7776a940c6bd9be6f5de3a878318d","9324632c14651add0cbb1bbf89cea843873c899f7ab5cca74f68f59009fa94aa"],"wasuremono":[17,"232424baa120d6feced6bc9b267632c1fd66100aac2e96a8028e1e04523b16f1","2c42bc20f27d050830cb86d98334926f3c29f5a55a8d7393f8e92f85c70a48df"],"kumonoito":[5,"fde3a5ec666696a2336ac8f78c5244030108ba3d6ffc62a279a7088c365bd9af","1f64495990521e44812ade9046853627f46130a84817f44efcb2d1dd7151fd5c"],"eitaibashinoyakusoku":[4,"e223973a1f61c5f018de65a296705ff16c2f13947030f9c4caa91e251b9e45aa","fd66f7db1a3fdd6dbcd712ea2fe4bd31a422daf254bafc4c96765fc4d65a14e3"],"kageboushinoshakkin":[12,"3c3cc7692b4005d79d464cf002b80178845f0a2bf481de3a485f9615e2f7b5dc","06390e0d2ab08cdbfdc975df7a3e9890a14f33c580ffd71ab3b1964562626180"],"kuranonakanokoe":[6,"12c5e64cb9e966f0d924c489a356c058737cc09cbe6db32c65e5e8e34e36a728","931d90eb4d4d840b02de19d74bc0877524fb7da6dfec3a449e08e75b562f523e"],"yanaginoshitanootoko":[12,"f4b447fd84aa1bd7668900f246abc475b41101b5584bdfe529d7c8ab4f067d74","9f51ecc970e01fabc7fc93891b4361ce7653d2f1f3363be290c74ad8d7c563f2"],"kubinashijizou":[13,"d11afa930126e67991212b7a7621d08f16c0c73f7e4cf0ed9078150bb2fb9979","e605eed9a704882d3298fbf57bc464e70c37a41c48aa55c9c1f24fd2a83e9260"],"momoyogayoi":[4,"3b81e52fa9e7645313024caacf8e38ccaac59430645f4696916cd451f0b86bbc","908f40d4dbdc2669dc6dbb0b5024915aba14f603a909d8993277aef17aa92f89"],"yomenaifumi":[6,"4f2189e60cf4d07eec7fb6690b054f84d95e5e1d565cac2bdd16b03587e86407","6a2d5eeaf4c5b539aa65a1d791cee91a7b22991b8b6d3440cbe718067cf6ed94"],"kagamishinoigon":[7,"3aee330fac350f856c5d2da01929453de3606f6f2b664f49a36baac0c3c4593c","b12dc9578e5cc57102b69a29b94d7ce130af8e918969db39c3039d8585f67fc0"],"rashoumonnoato":[14,"0bf56413a9d5ef03d01dcbec7082d614a78a2499d9263c102abc088aba98e5a4","533f024c3e0ac938a0e7a2155209fe2996e181b9d444e8e09a6070bc05cbbd96"],"henshin":[18,"85d8eb4946abd0db9275e44d7d51220e4935d8ef1d5b786da303e68b01260e8e","90f82456b63943d5d127f073ce576fc99c819449c186c00eb509face384df72b"],"sanninshimai":[5,"8df18a4df7d5af58270d5480fc09d3cea11601759f857e06e7090e8f016743cc","5f8d36ad132f7c9e9f4a3494940a5fa41f2eb14962f8aceb4f39506be724ba58"],"kyoukinonuma":[20,"22af4fda06379b92f294d65cc1ca56703df94978b25184ae2278d390595d70a1","bbf7d5fdb12bd83a6632ce61122989fe9ef9bcc6499ce88488f8b0117cd6e775"],"okenonakanokao":[14,"4b8bd2dd0de3cf5efaed33f783bc0c642ac3fda97e0fbb3863b5021349d2e668","4785590e8944c6cdde23c188f697557101b73bed3074721ef6ae78f3db69a747"],"tsujigirinoie":[22,"c9af3edfa84234b8325c685fa0260729da1a304b1deb8c1a590029ad4dd16700","a5e4724006e89ec205211d515f2345d9fe5bb21159ad44c2ee52c833b7bea7f8"],"kitsunenoyomeiri":[20,"ad3293c229297da7bcba32efc2e3591323a5f1e4565126350c21c164fbb51228","b17f5b4d90b140c4f0a6a5b16fdedcaaa20e2d890a9b48479a7552f9afd262dc"],"mushinooto":[8,"fa02aa25bb89d0d77755845c36f759eeeb68f55b3e0251df8712e46251d20728","027cf10000f60fda877b2aaeb21367859d31a9a9b858868cecd49434773543b8"],"senryoubako":[18,"c11523b8e220e2b7518c0cd7e216f2b90bdfb12c9da0104f0aa065289c65c292","caef12e13bd1b59ae28875ffeed7002c322da9c50fbd9a28ba963c39b573dc3d"],"kietahanayome":[20,"dfc7f9d8967cb0e1b3b77c4b38bdf93270dddf1341179556146895d4f661ff83","7fb5ada79df60a6d0dc8262dbbab431bd2e74f6a1973d56f1647fa24f170681f"],"miminashihouichinootouto":[19,"6ede37dc902f08969b801d2a7c78e1afdcb1a4c7ea3512f58297e8fb961e63b0","56895aaa0278b1a171a58fc7b7a2a5fdd88637648665e5841d334e2f65ad28e4"],"hotarunoshuku":[18,"394c9375740f06f84364fe258968d1012fc5a7bce0f138cf7beb612e4bcdcea3","0e462140e7a0e990a27f31a3a129fe9fb46d701f6e5b6279b4f59a752a6a805b"],"kamadononakanokoe":[13,"d144d44ae69f3bf0a80df64b894673c782b2740735cefc499b60533109ffd888","e63e4cb2cf8b265964df3f90dcd66d82850968da9325aaf6504f27bc358eca1c"],"kaminingyounokoi":[17,"963c8f22c741fe0fef1c4d260b7b1bc6ce2b168d400ac9898a4f85713b7a055f","68879e3356eb049e41ae87493ce42cc49370eae056d070979b31a96ea70b49e8"],"karasunoigon":[11,"3a48f7b2f283c1a8d618180b5d4e0c898e1e8cedd4b17ba6a71947f2123f467b","510f9048824bb820b4686b1f17e0ed9ff9def02971d9be9dd0062612fd5b31d6"],"kujinomura":[8,"86790b3dd374982bc860afec1299a6da5cf14b2b10876b22e49a91455ebb01bc","9083a89ca0b0d775e5aea26d157629c6389d8594aca2d409af52dcc182a4fd8a"],"ugokanaibantou":[17,"04bca1b64d4046ae0d5e40a47d931e76364d7fe9a9cc71cca2b7c3881d6f7794","4178374cc45d4944cd02d92013ae82e6862f44fb471744ca6108d3ce08d853eb"],"obochigainokateikyoushi":[5,"05b9c4872556b74ccf728768c62e31303a173afb27759bc0d34859767d3403fc","123430f9a7ee8d08c385062483f937d606f69893d51cd25e87e9fd7aa19b01a9"],"yoseatsumenoningyou":[15,"a9d5deb028755d6e99296d5f53879e5716cbbf3b63dcf1297528e707da4c933b","2c75ec6f3af3a8b3d0cade8780967e38b6b2a8d546a32b0c3d332bed9bd70b89"],"morinonakanoutagai":[22,"41faeb9c51f38c64b7d4ba1374d04b8af11825527ad4ee6964d5745bebbdf56e","a4469fb8ca02622031235848fa9f35fc754e41ca35abf77d35fdf58e799be9dd"],"kikunoyakusoku":[9,"2a493de087a992ff480d1f4cc25504b774d1a671e10e7bef348a627945d3089c","5b6d8dfab1ec63766b69b84f9398e25bbb86f8b46c03e4116aed6737c48b7876"],"ashiwokaruonna":[6,"1468eccc17562be001f245c0276c4629629997d470f14111c05482285412b401","7dec3f7a838dee1eb9e68a81196e6b81a20b664e816328602c8eadf53bee0d22"],"sugorokunohate":[16,"7584b2b175e1a4e28d136ef45d6593bbdb6fb14f02789de65c4ce7e9d6aca3ad","0b44a121163e465c5981355fa333d12023c42024bb58076e924452d7077dc8a5"],"shinkiroonomise":[4,"e7cc769011ec84031bffe08c71edf8b983f3900e5bdbe51990bb3ec777e56dce","35f9aea356bfddb0a5a4d98e058e67e601d8d86e2f04bd162e359d2b21ebb1a0"],"kodamanoshukudai":[12,"6a09b9e20c77cb65ecfdd38a5fcf0f0afd215bf1992c2232b020ee0456a42147","a33fb0262741bc631eec21508d1b908632e7213439e6722a1f1c3ad3b2e0d094"],"katatsumurinoshisha":[17,"21030367e63833848b6139450739ddd32362b039819fc778f0106d79847bba1e","730e83df4b6ed6f496d16322c1810c60072b7d70c335af6a42c47023e53f2a88"],"hyakumonogatariwoyameruotoko":[15,"3d71522c7a460d860f2622c2f34cbee1a1b079a7107eea00d169ab23148eedb4","f47b2450650d035992683db2a21bfe7a1927b77615a731f17a3de63f6f8fd491"],"kakashimondou":[10,"b112032dfc568d512308cb2ce66ab3dacb51992bb9dcfaef299d185031887cd3","461ff3f610e6ac33fb10a521cec639fe653faf8ef093059ead6742b3bbffdce2"],"koorinurinokage":[9,"0322ab8609e831cb2426162e4568ee4b2d317b6ca956f2a1e1fc28b0b48c2793","23e684e1796be0a6c8364e8fc9a87f171ccbce20c1baad2d3967b53151e9d8ab"],"koumoridonya":[8,"c9e73c47d32c0a4a4c18f78d966e053007d9c0c3e9843317bf152040ee8145c9","6f5af11c0bdf3a0add96148f65a03f2aab197c73bc330297b2b796fe4ba68f09"],"joumaeyanokagi":[15,"1633dd14db6ce3d19395ac78e77c9a5ea2f9297fbaab2c05781853d31be5f985","d1adef19e5bbdae2829ac4885cd62e58965f139dbfd3b53c7e23dc892c10dfe6"],"choochinnohiwake":[13,"2abd85cc7bbb1cf29a46639777b638c5b4a4316aeb14355037551d4cf59a6291","3d983e89849b320fc71e61edf61ce2d0b4a9c8653957169157978bf2ee7e5200"],"seminoyadogae":[6,"8e6caa6902d441486b10f805b254e4fb225952d564432b1d73bdb9cdcd87f7b0","2f42999557155e90a466419e5eb4b9747fd3cb90865bc5aac274899e931b4c42"],"momijinotayori":[5,"99c7c1e84d7f5ef7e294bd7abe135dd76cdc733df7a4d66a833011ebf4f2800e","5a4d551d8c735ee9b313d9193c25ccc02b66b660bfd1186faec487bf2d50f1c0"],"hyakumonogatarinohi":[27,"eca8e09d94f6138bcf6174ad4638fa7cae0c01391de4455cf441afbbfd6dea0a","af8e153142586811fb9670443a1f6ac187b75a9df041a608821eab838098d37b"],"akazunoma":[4,"89d5711af755d12078aa1a9e495b071d7b5c3a7a4b2c721dfff84f9ce247eab5","74a62fc78c2b0dac70beb13af4e3d9f88e64a1e6d9316419ab45d55e9a69dd76"],"taketorinogojitsu":[1,"90e60f4195df2a06a588a9d1091b82d961836c761b97c75f11a199e2991e242e","1282757e938aedd0d853a0b487cad882db466585aecddae6b7199a690952d30f"],"sakenominowana":[10,"eeded918fed55d4000a6184e987f0a970624239a032fc66a08cf9e8c8251e929","801f48537b6ac32dad2f7c5b2c544746ed9674478a5f2fd5649800fe7111b7d7"],"tanmononoyukue":[15,"7ffcfca00a81708d2b10e9b71e6a9d6f79f559f6db58016a5f6ff7a08fd2cab0","9fa527dd3ad3e4b691c8043b7bee8dc6416b18eded4c608409d909fabe879c52"],"arinogyouretsu":[3,"8c185c14c57530ba25e2d0340347eb4bc0b76effcafe6557d97ac786b6cdbb03","b8e5ffa9a395769dd1a2054919297872ce79f29734533af6523a96240d6b4fa0"],"mikazukinokatana":[10,"0b58ec8f856cfa191c37c1f44ae7ff75c5b473b147e70f9ba10c871032ccc019","09db7231746ffc6d5ae771f28ac8ded2fdbe726975eff48f756b6741cbc1284e"],"suzurinonakanoumi":[6,"f656156359b77e4e359aa135438445f447c20aca8885f80acf435c16705caa02","077faf2e6c85d2745af058dd513c25d54da1d191362ece00f1bfb0eacfcb0a0c"],"kagononakanokoe":[15,"323caa20d068ae13c9a634cb00cf28d42988dc818c11c6687dd3902fc77d348b","a47e3f5572b870218899f6bbb35fdbff78186a3ba760ce1bacf7163158ad5ef7"],"kingyonome":[16,"08b76a0a590d2bcabcb0e68b28b22d31e171ee75f9e5869b4899e1a04829541d","b64fc583dd6af07f90e99007b4402b4a654561e3e8e1db18037119195896fdd0"],"chounoigon":[3,"92808d5d6aa39be03f9b3f834367fb22af86e4b5f301b24404eb0497031fe1e6","2364273dac90d1021ca766d6d317c9d0bae794f5765ff9dc2a10951ddcb47222"],"ishinokioku":[9,"a1b569bf10ec07f5de462a5bdcc3566954e84d73a1f7395fd07ee33d8bde68f4","9dabe48abcc9d454a87afa6335bf04f11284d5d4a38a44540a3942d5d308cc3b"],"shamisenborinotsuki":[8,"0534906996b28cab8da560dd512a31e7f408691f5e61d3131bcc1f865d31ed6b","48379063903e9a378ab2987fedcda6acd7d3224a97fcdcf75142405dff4f29a8"],"tonbonomichishirube":[13,"23ff9fceee7eaa56867919bf37f185f4934d8eb41f996d7889db2b1f95789b9f","28229a87f92bd149029a752396f5c55ee28360a6a4ba865e84cbffde7a1c2571"],"takeboukinoodori":[12,"a60f627b250afe0678e319a2c218ded51952bda9cca117ed5a32afb81c59e7b2","43e69e20792959626102fce4ac95a79232d3a86f64d32b924bfd969b138ebef6"],"nawanorennokoe":[15,"34c1ddfd9abddc88bfec3e3ac76fe3274673aad27cbaaf980e544dcdf3c8b312","b6e416d5d8c608982c048e0b8348c7d805f060d0f7cb91a53ad2d1650bffd5ba"],"choochinnokaeshiwasure":[17,"3a19dfaebc8e21c25435fb7a803404c10a461ce694e38da0aa30e6fac298b16b","589344e8be5f48fabaf21b17c33d62540b961f43d6de5f3fa9030397db582796"],"mukadenochuukoku":[14,"77be4571ca085bea80c7518667e8f695dd46fa4ff1c1c0565b05954aa9c58ff1","9bdf872de6c00dc424c9c19a3f9b515d0270a853aca49a1ed279c786dc8c9117"],"tsurunoongaeshinoato":[8,"db4723c993185a8f554c85a242f1659c5dfb3a9df895e9c4c5ecb67b30380677","1d449c87bc8992b687b701ecf47535b71fe5370fa0bc78dfca585abc8ab3e6fa"],"hyakumonogatarinohyakuichiwame":[3,"624190be1256af8ca5d7f69b0d4ab726bca14966ec27c32c0a44a5c5a588ffd0","9dbd03b4efaf970270b1e8a59cc857c453c6c2a13580fc52143639f2c40302e0"],"kageokuri":[9,"30cd586c4d0afedfd7b4188c426a37670bf5025adae6a11189de1a0961c5e748","10770d52a55c188e1ad9d00360ababd7fc774a552b2e028e4c30c3b429a20ca1"],"kujuukunohi":[10,"5e75983ca9e82a528283a1a97267f51775e17cf183c5e96585577db6ff028263","4a761e4b8ec315d6585a779d58237b1a73b00e0cf95deab2f1e278a2a24b5554"],"toushinnotsuzuki":[8,"b1601ef9f5a30cae9f8d3647cb425ae9a21d39cc976c90cc7237083c6999884c","2bbd67d7c579a86adfa283fb4654661770ad193f6bd19337c91c0f287e5a46bd"],"miyazakinohi":[3,"650c8797b3cfb863844afeb3c785d832014ac09c5ac6776bdcc76c8df2eccfcc","9e75160c97bf6e08d4a0b120672fe70d5d7d50401b7be6bf1b03211236e1a397"],"saigonotoushin":[3,"991039e380986bd8ec4f68ef7e0b35a0611365855c52809d70d7fe04bc7bdca3","08f9fe8021944ff8365d44f7a68f88dddf88e52a196540d315ce0bfaa393d664"]};
 const checkedBodyReadings=new Set();
 const formats=[
  {dir:'kaidan',klass:'kaidan-illustration',suffix:'',aspect:4/3,maxWidth:760},
  {dir:'kaidan-scenes',klass:'kaidan-scene',suffix:'-scene',aspect:9/16,maxWidth:320},
 ];
 for(const mode of formats){
  const dir='assets/'+mode.dir;
  const pattern=new RegExp('^\\d{3}-[a-z]+'+mode.suffix+'\\.webp$');
  const artFiles=fs.existsSync(dir)?fs.readdirSync(dir).filter(name=>pattern.test(name)).sort():[];
  for(const filename of artFiles){
   const slug=filename.slice(4,-5-mode.suffix.length);
   const sampleLayouts=filename===artFiles[0]||filename===artFiles.at(-1);
   for(const width of sampleLayouts?[320,390,1280]:[390]){
    const context=await browser.newContext({viewport:{width,height:820},reducedMotion:'reduce'});
    try{
     const page=await context.newPage();
     await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
     const imageResponse=page.waitForResponse(res=>res.url().endsWith('/'+mode.dir+'/'+filename));
     await page.goto('http://127.0.0.1:8765/kaidan/'+slug+'.html',{waitUntil:'domcontentloaded'});
     if(mode.dir==='kaidan'&&width===390){
      const approved=reviewedBodyReadings[slug];
      assert.ok(approved,'Approved reading digest exists for '+slug);
      const got=await page.locator('.record-body').evaluate(body=>{
       const plain=el=>{const copy=el.cloneNode(true);copy.querySelectorAll('rt,rp').forEach(n=>n.remove());return copy.textContent};
       const rubies=[...body.querySelectorAll('ruby')];
       return {
        prose:[...body.querySelectorAll('p')].map(plain),
        readings:rubies.map(el=>[plain(el),el.querySelector(':scope > rt')?.textContent]),
        valid:rubies.every(el=>el.querySelectorAll(':scope > rt').length===1&&!el.querySelector('ruby')),
        readable:rubies.every(el=>[el,el.querySelector(':scope > rt')].every(part=>part&&[...part.getClientRects()].some(r=>r.left>=-1&&r.right<=innerWidth+1&&r.width>0&&r.height>0)))
       };
      });
      const digest=value=>require('node:crypto').createHash('sha256').update(JSON.stringify(value)).digest('hex');
      assert.ok(got.valid&&got.readable,slug+' ruby structure/visibility');
      assert.deepEqual([got.readings.length,digest(got.prose),digest(got.readings)],approved,slug+' original prose and ordered readings');
      checkedBodyReadings.add(slug);
     }
     const figure=page.locator('figure.'+mode.klass);
     assert.equal(await figure.count(),1);
     const initialSize=await figure.locator('img').evaluate(img=>img.getBoundingClientRect().height);
     await figure.scrollIntoViewIfNeeded();
     const response=await imageResponse;
     assert.equal(response.status(),200);
     assert.match(response.headers()['content-type'],/^image\/webp(?:$|;)/);
     const dimensions=await figure.evaluate(async el=>{
      const img=el.querySelector('img');await img.decode();const box=img.getBoundingClientRect();
      return {native:[img.naturalWidth,img.naturalHeight],hint:[Number(img.getAttribute('width')),Number(img.getAttribute('height'))],
       box:[box.left,box.right,box.width,box.height],head:el.previousElementSibling?.className,
       body:el.nextElementSibling?.className,prevTag:el.previousElementSibling?.tagName,nextTag:el.nextElementSibling?.tagName,
       nextClass:el.nextElementSibling?.className,nextLetter:el.nextElementSibling?.querySelector('.kaidan-letter-tag')?.textContent,parent:el.parentElement.className,afterParent:el.parentElement.nextElementSibling?.className,atPara:[...el.parentElement.children].slice(0,[...el.parentElement.children].indexOf(el)).filter(node=>node.tagName==='P').length,
       viewport:innerWidth};
     });
     assert.ok(dimensions.box[0]>=0&&dimensions.box[1]<=dimensions.viewport);
     assert.ok(dimensions.box[2]<=mode.maxWidth+0.5);
     assert.ok(Math.abs(dimensions.box[2]/dimensions.box[3]-mode.aspect)<0.01);
     assert.ok(Math.abs(dimensions.box[3]-initialSize)<=1,'Image dimensions reserve space before decoding');
     assert.deepEqual(dimensions.native,dimensions.hint);
     if(dimensions.parent==='record-body'){
      assert.equal(dimensions.prevTag,'P');
      const reviewedCoda=!dimensions.nextTag&&((mode.klass==='kaidan-illustration'&&['miyazakinohi', 'tanmononoyukue', 'toushinnotsuzuki', 'wasuremono'].includes(slug))||(mode.klass==='kaidan-scene'&&['akazunoma', 'chounoigon', 'egusashi', 'henshin', 'hotarunoshuku', 'kagamishinoigon', 'kageboushinoshakkin', 'kageokuri', 'kagononakanokoe', 'kamadononakanokoe', 'karasunoigon', 'katatsumurinoshisha', 'kietahanayome', 'kikunoyakusoku', 'kingyonome', 'kitsunenoyomeiri', 'kodamanoshukudai', 'kubinashijizou', 'kujinomura', 'kujuukunohi', 'kuranonakanokoe', 'momijinotayori', 'momoyogayoi', 'morinonakanoutagai', 'mukadenochuukoku', 'mushinooto', 'nawanorennokoe', 'noumennoonna', 'obochigainokateikyoushi', 'okenonakanokao', 'rashoumonnoato', 'ryousainokyaku', 'sanninshimai', 'seminoyadogae', 'senryoubako', 'shamisenborinotsuki', 'shinkiroonomise', 'takeboukinoodori', 'tsujigirinoie', 'yanaginoshitanootoko', 'yomenaifumi', 'yoseatsumenoningyou'].includes(slug)));
      if(reviewedCoda)assert.equal(dimensions.afterParent,'omake');
      else if(mode.klass==='kaidan-scene'&&slug==='tanmononoyukue'){
       assert.equal(dimensions.nextTag,'DIV');assert.equal(dimensions.nextClass,'kaidan-letter');
       assert.equal(dimensions.nextLetter,'書簡二');assert.equal(dimensions.atPara,3);
      }else assert.equal(dimensions.nextTag,'P');
      if(mode.klass==='kaidan-scene'&&slug==='fumitsukai')assert.equal(dimensions.atPara,3);
     }else{
      assert.equal(mode.klass,'kaidan-illustration');
      assert.equal(dimensions.head,'record-head');assert.equal(dimensions.body,'record-body');
     }
     if(width===390&&sampleLayouts)await figure.screenshot({path:'test-artifacts/brand/'+mode.klass+'-'+slug+'.png'});
    }finally{await context.close();}
   }
  }
 }

 assert.equal(checkedBodyReadings.size,Object.keys(reviewedBodyReadings).length,'Chromium covered all 99 story pages');
 // Furigana must leave the readable base text unchanged and remain legible across widths.
 const rubyCases=[["fumitsukai","寛永通宝",25,"d1eba7de418df93c2d827c8f61211765ea2058f91c178bd5afe7a3b1a5946ec4"],["shamisen","三味線",13,"879ce8021d8501010eee1e6aea56cff6f6bbf791323d985cc28957df34a49f8f"],["yuya","湯女",15,"0fbb48b8d97868e76794a1d702307b74528f9b60f782a2553b2bc30c32138a46"]];
 for(const [slug,base,count,sha] of rubyCases){
  for(const [width,scale] of [[320,1],[390,2],[1280,1]]){
   const context=await browser.newContext({viewport:{width,height:850},reducedMotion:'reduce'});
   try{
    const page=await context.newPage();
    await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await page.goto('http://127.0.0.1:8765/kaidan/'+slug+'.html',{waitUntil:'load'});
    if(scale===2)await page.locator('.record-body').evaluate(el=>{el.style.fontSize=(parseFloat(getComputedStyle(el).fontSize)*2)+'px'});
    const observed=await page.locator('.record-body').evaluate((body,base)=>{
     const rubies=[...body.querySelectorAll('ruby')];
     const plain=el=>{const copy=el.cloneNode(true);copy.querySelectorAll('rt,rp').forEach(n=>n.remove());return copy.textContent};
     const hasRuby=rubies.some(el=>plain(el)===base&&Boolean(el.querySelector(':scope > rt')?.textContent));
     const fits=rubies.every(el=>[el,...el.querySelectorAll(':scope > rt')].every(part=>[...part.getClientRects()].every(r=>r.left>=-1&&r.right<=window.innerWidth+1&&r.height>0)));
     const valid=rubies.every(el=>el.querySelectorAll(':scope > rt').length===1&&!el.querySelector('ruby'));
     return {count:rubies.length,hasRuby,fits,valid,plain:[...body.querySelectorAll(':scope > p')].map(plain).join('\u0000')};
    },base);
    assert.equal(observed.count,count,slug);
    assert.ok(observed.hasRuby&&observed.fits&&observed.valid,slug+' '+width+' '+scale);
    assert.equal(require('node:crypto').createHash('sha256').update(observed.plain).digest('hex'),sha,slug);
   }finally{await context.close();}
  }
 }
 fs.writeFileSync('test-artifacts/brand/results.json',JSON.stringify(results,null,2));console.log('Brand, menu, fallback, reduced-motion and two-second session-intro tests passed',results);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
