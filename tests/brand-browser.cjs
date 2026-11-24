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
 // Fetch and decode each illustration in a mobile viewport. For the first and
 // newest in each format, also check narrow/desktop layout and the reserved space.
 const reviewedBodyReadings={"fumitsukai":[20,"6e6776502036dc6871aed0be2b9401811121d02e42b0690f195089d8c2953a7b","cb33a3425acc6626214bc0a937ef23350b7699d8b04f2981be5160d09291c6b7"],"shamisen":[11,"61b5d5679a63d86aad77330230c4388dab665c14c0a25bb70e2ed4cdb10df565","fca57e45cc090a3c78bf853667ea3b67b407bd17d1f573f9de2833c4423e8030"],"yuya":[12,"1ed09703601a4015467c070aa80a287a04077dce1cb76175035a503876fb2510","4ac93fa48e7a294a6614e004aad9685a9f4e762f4b316dd9f94acae80e0cc167"],"sonryoya":[22,"3a6875bae3485713974eac13ebc52b697a69a4b21fe6d53c681166ff5bb77848","522c1a1b42be6ad6af679bd62a639977db3c29ac7ec1a7480635e4778329bf29"],"kamiyui":[6,"a0bab207d7b2ddb30012db0e27b5062e6abe52a4932b4d88eb48fa8bde93e6b5","89125ef06c7089ee9c93da6c2a795308ea39d4241e108e85781f834025b1b0ed"],"sobayatai":[23,"e7b9796f82bad9259d244fe426658e103ed84a2062c0edee8f30361c39db5451","7407c12cdd2c19cc1b7192a75e9a92a0630a85d83fc877ec155ced34bd36c61b"],"shichiya":[15,"df4de86677ee8077a4183717e9538962ff2e82c5a6af574d5100fe07b3f70cdd","6176a7fa579ad2ddc9d11c0193cf93a9a0634d05aa107fb1aa779a80d011ab79"],"hanabishi":[15,"daaa6f3b85fe8f0d694eddecb560a97173a0cae5fa28dbc09a71a6d00e31b9b3","1fb26b3420d6a88abf1e4fb47c6ecde4fa12a625d722734208873161a89973bd"],"uwasa":[16,"728b69b6ec23772fecafcbce4407d5ceaaf3581e7d617796da00021e5240d1ff","238764338ee27552258356fca7bd2b5131d251f4f9672105ee9afebf0c4d8abe"],"hanami":[4,"37c24bbba354eb16ee8fbe958f5a6b569dca179decb80692c101cedd98b89b4d","4f563c72a01929c9988c4a21b1e1516c671e883d0f155625dd6fd477f7490edc"],"kawatare":[16,"18c911617f4a0fbcac9c1f68dc71a65b45d2db92f9a4935cae22d882205ec484","5054ca14cb46957d3e6daaa96ead79efb83c9277877e199f29f4361f55be84f8"],"mojiuri":[21,"8950ed7b248993d9d194ca0b76f3844f66741503ccad4c3aa290517a1bdcf4a8","eaf933482b46df6ab4365c1248dd27826527ea7d160f08580f72178f03f1d0e8"],"sanninshogen":[13,"cf66d90e5ba08162b5125f161804eb571c0625f61575401ec855cabd98aa084d","546889adaf2a0dd1818ce78d1e2506c4b77fa97318ab223e87a975dd767b6130"],"egusashi":[8,"972fcf50928742e8d4b1cbae1423589ad9e0611ec1a1b6ac03891d1cd52f0ba3","51c7ed77b8d021f1568e8b326f70879e403a95d5e7772cbe9da009f79158e5db"],"atowoouotoko":[11,"e6ffaa44ed2cd1119eb45e7999ee36f4f67310467c767152a9d53fa437e876c7","a4d356e39f77f8a3a8273a0154abc21beca0e80bd239dc59d7e2f31435d51069"],"shakkintori":[19,"d682a79bf68483a60ebb24b940afdb687f20760ea6f0bd1843ce1523762be506","08e5a85e3f9fc1ea6d5a2fcbf34358130bf45324c9f722da8abab7b567cd4aa3"],"iwainohi":[11,"e9d2afe9618624f3eced6f4ca9b950517fe7d479451fc01da3ebd5d481a0a499","41e3b38863579b5fb04e362e14d68cb0ea77597bace0dd71dfaac8c1c88aa3d7"],"sainome":[9,"cd6c57730bdbffbdc69b61d03a72260a01d7ca4f5c8210ca13db7d99595ff21d","e70658448f87a4b31f25222f78e577e9977c12acf2bf745525c4bed1fcbba10a"],"ouraikippu":[4,"730becf58db15bf9176995b33c34d1f855db0417056977bd8e2aa57e23bb86df","fb9b84e82771927aa20ce2cc2ff5a6dd9f77c3c7b3c5125c78e9d972d684c46d"],"hakononaka":[3,"48df5601911e56ff266b72ee90b5b8b0c2278de0b60133e710ee5ad161bb6a12","9b012ec899666a6c0c253fc47f97ce33cbb7be842e1d20c9e9c0e86486a423cb"],"kagenobundake":[20,"a54bd8190850853fa934988e572d4908eaf00abd2d460940e4c848d0166c21fe","9a8fd063aa600e3935eb2114af83a3c60b3448fecff8ecb3567a87acb063f991"],"yoban":[16,"ed58877f20e24d7ef3983915b5eb77e9e9a230523d59715c34a356807fe2a5b3","fe6c4f801f75f1c1363441bbb65bd3734199f1793fe2b8992ed9c3d6c54aa59b"],"futagonohashi":[3,"d454fe1468a299d5466e0080fbb896b30dba9f2c1a9cd8bfa1692af93b46daf5","65a70c146b3acfe2e85e3adff3369b0db74aebc14c0efa05f62332a15f29f564"],"saigonokyaku":[12,"c20a28a0a70081e0ea324205f3c281f06f608cf9b9e75df51d2240abf962da50","84e89d0475ff38555f796ff4b71906b8ab6d9601dfca433b0d3f47faaf7e96a2"],"hyakumonogatarinoato":[11,"96196bbc6cc637bd118eee8fd7f00b343cd679da7ee02f3eb89b965f8481021b","6b1f1f593bc0c7dd0eb906df4c9fc182827a555909a255193f96bc35cae9931d"],"yakushae":[3,"d7c1444328c1bd9a5e4fb5a3cc41a59c0116da832612a73f06ff5d6613a8fff4","7cbef44fe2615cd13e36f315694784b04cff5a3a8c06722eb2fb045164f9f0d3"],"mittsunonegai":[8,"4581d316648fb64f2a379fd3a8641935c5d09dcc839ab11315f612933c215abd","f49db58289f5b34947202ad84c60ed59ffc10e1c92c1f79dc85888f279b53037"],"ryousainokyaku":[3,"0f253137832f7280e2d46a423d4336188328137933e88fa8356b36e026113b24","c5df7ce10773181675efa80aaea10e33c3dfab043b18f1be42f60b6b9c7b07db"],"noumennoonna":[18,"8c879dadbaab30f2b79c4a8b7275477fd1664fc057b36f71f1dec07b0d9d078e","e5ac7e9419f4875e5709404b3e6f29f534f4fb8b5beb1de1074fd3e2b04d21c1"],"mitsugonosanba":[3,"d02cf3fa9ee267368d8dce480a3a39ffa3b7776a940c6bd9be6f5de3a878318d","08f0546132f3c52dadebab750ffa3a95560b12219d26453341118ea34e5f3bc8"],"wasuremono":[14,"232424baa120d6feced6bc9b267632c1fd66100aac2e96a8028e1e04523b16f1","96ab44ac15314f08e9904cc34919a4c4dd74ca9dd6f0b6c17ef827b1f4f506ee"],"kumonoito":[2,"fde3a5ec666696a2336ac8f78c5244030108ba3d6ffc62a279a7088c365bd9af","ad2453c49527afcc205630daa1892fc4450f77eaa90458061ebd03068c293c25"],"eitaibashinoyakusoku":[2,"e223973a1f61c5f018de65a296705ff16c2f13947030f9c4caa91e251b9e45aa","cf76dd45c425d1dbc482f6d5871c04b72f1ba8a465c14459c1507fc49330cb0a"],"kageboushinoshakkin":[12,"3c3cc7692b4005d79d464cf002b80178845f0a2bf481de3a485f9615e2f7b5dc","06390e0d2ab08cdbfdc975df7a3e9890a14f33c580ffd71ab3b1964562626180"],"kuranonakanokoe":[4,"12c5e64cb9e966f0d924c489a356c058737cc09cbe6db32c65e5e8e34e36a728","5903dc60b4890ddeb787ec14ada6c69f6a068f6b163d0a6c67f6ba49b20ba575"],"yanaginoshitanootoko":[10,"f4b447fd84aa1bd7668900f246abc475b41101b5584bdfe529d7c8ab4f067d74","4db8f7c1eaa634061d7ef7d5330e17b704a2a3fac8ec5461cafb6818a7d0f649"],"kubinashijizou":[12,"d11afa930126e67991212b7a7621d08f16c0c73f7e4cf0ed9078150bb2fb9979","9ac861c20de7af874b844d93ef9534eed67c92c4dc66cfee950b35e3dacfd128"],"momoyogayoi":[2,"3b81e52fa9e7645313024caacf8e38ccaac59430645f4696916cd451f0b86bbc","0f5ad2d3226ae022e1f6fbd29daaa23d41402d223b7b9663b1898fad5023f18c"],"yomenaifumi":[3,"4f2189e60cf4d07eec7fb6690b054f84d95e5e1d565cac2bdd16b03587e86407","79a2d513ddbbd44a78721d2767d15941336a2251d606486f7d3b8c25a78c8126"],"kagamishinoigon":[6,"3aee330fac350f856c5d2da01929453de3606f6f2b664f49a36baac0c3c4593c","0818006b952d785f7d1f05cbb07e3de484fe30ce619819d5d300b0a689226003"],"rashoumonnoato":[13,"0bf56413a9d5ef03d01dcbec7082d614a78a2499d9263c102abc088aba98e5a4","aa33327626c71b43daa9cbc64c943f3acba42711354b38627b24b60abc207b9d"],"henshin":[18,"85d8eb4946abd0db9275e44d7d51220e4935d8ef1d5b786da303e68b01260e8e","90f82456b63943d5d127f073ce576fc99c819449c186c00eb509face384df72b"],"sanninshimai":[4,"8df18a4df7d5af58270d5480fc09d3cea11601759f857e06e7090e8f016743cc","c9e1479617537e06df67fa30577e405635d6d73d3c7c31def990daa31c84163d"],"kyoukinonuma":[18,"22af4fda06379b92f294d65cc1ca56703df94978b25184ae2278d390595d70a1","28e215410c19b6d4c45699e38861eda61c7cc007b3955eaee83e7b7cc15d34f1"],"okenonakanokao":[13,"4b8bd2dd0de3cf5efaed33f783bc0c642ac3fda97e0fbb3863b5021349d2e668","e366ce846c0bbd01d5547f8d29ed2eea398368532f49814d46eed10ed2abb692"],"tsujigirinoie":[18,"c9af3edfa84234b8325c685fa0260729da1a304b1deb8c1a590029ad4dd16700","b8b123a8b51e1050eaf11d299105326cf1f11771cdacf06d98db3c7dc5bb5a67"],"kitsunenoyomeiri":[17,"ad3293c229297da7bcba32efc2e3591323a5f1e4565126350c21c164fbb51228","d2f5b1b15aac6b5b02cb778d9c7904543636543673ee8d281adcebc51924701e"],"mushinooto":[6,"fa02aa25bb89d0d77755845c36f759eeeb68f55b3e0251df8712e46251d20728","2c2413d6f2ed4e15bc3a9b09618db3dc63fe4b97f831c99aecb1a9a88d4ccdf2"],"senryoubako":[16,"c11523b8e220e2b7518c0cd7e216f2b90bdfb12c9da0104f0aa065289c65c292","cfccf1e0fa42af202723033da9899d6ef9cc7cec10529f7838309dc773666370"],"kietahanayome":[20,"dfc7f9d8967cb0e1b3b77c4b38bdf93270dddf1341179556146895d4f661ff83","7fb5ada79df60a6d0dc8262dbbab431bd2e74f6a1973d56f1647fa24f170681f"],"miminashihouichinootouto":[15,"6ede37dc902f08969b801d2a7c78e1afdcb1a4c7ea3512f58297e8fb961e63b0","4e78afa8b797961af7b9d793b3854d0d7982fbdbc4ada32f99af0f9123f77470"],"hotarunoshuku":[16,"394c9375740f06f84364fe258968d1012fc5a7bce0f138cf7beb612e4bcdcea3","a27d868392449324c8a133397ff7276d4808937acc4948bfbe06dc6b87ad46a6"],"kamadononakanokoe":[11,"d144d44ae69f3bf0a80df64b894673c782b2740735cefc499b60533109ffd888","ee4da919e5c663fa7cb376a3e87b966a3e799be1fc24e906cfe6bb70c2f4484d"],"kaminingyounokoi":[15,"963c8f22c741fe0fef1c4d260b7b1bc6ce2b168d400ac9898a4f85713b7a055f","80bab9263f719b354dad4cff8efee167ace2a52e4dffd2f139b68e7a045e24e6"],"karasunoigon":[8,"3a48f7b2f283c1a8d618180b5d4e0c898e1e8cedd4b17ba6a71947f2123f467b","07950d0d43d4ca68444f510b725a4459f86fedafb576244d3dd39a498eb6fe51"],"kujinomura":[7,"86790b3dd374982bc860afec1299a6da5cf14b2b10876b22e49a91455ebb01bc","35037d750da5ca11771cac58f569810264f6cdb3dd8a01d428190d6ef5f927ca"],"ugokanaibantou":[15,"04bca1b64d4046ae0d5e40a47d931e76364d7fe9a9cc71cca2b7c3881d6f7794","85f4e5fd03a2b51887406bd226934da52223030bd766bf562d858159edb3e635"],"obochigainokateikyoushi":[4,"05b9c4872556b74ccf728768c62e31303a173afb27759bc0d34859767d3403fc","37f2e37a1fc2224cd09ae68737744478c914b3b1a96c8f9ec6e2bf7a1cb38628"],"yoseatsumenoningyou":[15,"a9d5deb028755d6e99296d5f53879e5716cbbf3b63dcf1297528e707da4c933b","2c75ec6f3af3a8b3d0cade8780967e38b6b2a8d546a32b0c3d332bed9bd70b89"],"morinonakanoutagai":[20,"41faeb9c51f38c64b7d4ba1374d04b8af11825527ad4ee6964d5745bebbdf56e","119cc21775a2b7ca5387b8d012063ef3b6b3feb316a00165bf5a1a2ffbbaf3c9"],"kikunoyakusoku":[9,"2a493de087a992ff480d1f4cc25504b774d1a671e10e7bef348a627945d3089c","5b6d8dfab1ec63766b69b84f9398e25bbb86f8b46c03e4116aed6737c48b7876"],"ashiwokaruonna":[6,"1468eccc17562be001f245c0276c4629629997d470f14111c05482285412b401","7dec3f7a838dee1eb9e68a81196e6b81a20b664e816328602c8eadf53bee0d22"],"sugorokunohate":[15,"7584b2b175e1a4e28d136ef45d6593bbdb6fb14f02789de65c4ce7e9d6aca3ad","9e6d1bdbf4b88c450f56d206d87652ba489c08b380fa4cecbeaf2a82e3a19567"],"shinkiroonomise":[4,"e7cc769011ec84031bffe08c71edf8b983f3900e5bdbe51990bb3ec777e56dce","35f9aea356bfddb0a5a4d98e058e67e601d8d86e2f04bd162e359d2b21ebb1a0"],"kodamanoshukudai":[12,"6a09b9e20c77cb65ecfdd38a5fcf0f0afd215bf1992c2232b020ee0456a42147","a33fb0262741bc631eec21508d1b908632e7213439e6722a1f1c3ad3b2e0d094"],"katatsumurinoshisha":[16,"21030367e63833848b6139450739ddd32362b039819fc778f0106d79847bba1e","84279bfeb1757c6536cbea9ddddfd0c4d2e961545d73ccadd48a761f07735f61"],"hyakumonogatariwoyameruotoko":[15,"3d71522c7a460d860f2622c2f34cbee1a1b079a7107eea00d169ab23148eedb4","f47b2450650d035992683db2a21bfe7a1927b77615a731f17a3de63f6f8fd491"],"kakashimondou":[10,"b112032dfc568d512308cb2ce66ab3dacb51992bb9dcfaef299d185031887cd3","461ff3f610e6ac33fb10a521cec639fe653faf8ef093059ead6742b3bbffdce2"],"koorinurinokage":[7,"0322ab8609e831cb2426162e4568ee4b2d317b6ca956f2a1e1fc28b0b48c2793","e6cb01cccf9664f19b08786278646c51e67c5098437c04a6760f5359a822c1ed"],"koumoridonya":[3,"c9e73c47d32c0a4a4c18f78d966e053007d9c0c3e9843317bf152040ee8145c9","94a30131073d37a6f4474c2ef057f2ed78c2a8d47c6dd7dc60bd40a26a97c949"],"joumaeyanokagi":[12,"1633dd14db6ce3d19395ac78e77c9a5ea2f9297fbaab2c05781853d31be5f985","98d013504cf2099a5b2348a4134c13af03fe09264c0ae7051c6d15901b0654de"],"choochinnohiwake":[12,"2abd85cc7bbb1cf29a46639777b638c5b4a4316aeb14355037551d4cf59a6291","d42c3ffbc8a497fcbbf9a35abb702405b23e5e4373aefa4cfb4cb287e70386f2"],"seminoyadogae":[3,"8e6caa6902d441486b10f805b254e4fb225952d564432b1d73bdb9cdcd87f7b0","51ade840dacf7d88532bc8815fb29f6a881ab044dd50f1856e748ccba7e15e74"],"momijinotayori":[4,"99c7c1e84d7f5ef7e294bd7abe135dd76cdc733df7a4d66a833011ebf4f2800e","76ae4c87b6179ec3b9e975204799a0a05b784c7e4a5527d85a68a95e74887b9d"],"hyakumonogatarinohi":[26,"eca8e09d94f6138bcf6174ad4638fa7cae0c01391de4455cf441afbbfd6dea0a","6107f1ff91505b5dfc5a87cc78dc599a9188a4027803d0bf36684a2691326372"],"akazunoma":[3,"89d5711af755d12078aa1a9e495b071d7b5c3a7a4b2c721dfff84f9ce247eab5","f596e883dc9ab9b745879c373363596cd05a2bd7a6b2213c2d8055c875dfffd5"],"taketorinogojitsu":[1,"90e60f4195df2a06a588a9d1091b82d961836c761b97c75f11a199e2991e242e","1282757e938aedd0d853a0b487cad882db466585aecddae6b7199a690952d30f"],"sakenominowana":[8,"eeded918fed55d4000a6184e987f0a970624239a032fc66a08cf9e8c8251e929","b2bc8c00ebe0929d0c4517e544a57fa09f8f4fd477afd59635b20909bbb5a16a"],"tanmononoyukue":[14,"7ffcfca00a81708d2b10e9b71e6a9d6f79f559f6db58016a5f6ff7a08fd2cab0","0fc3b68d2217528ba26acef6fce275fce7fd3f7cd0af4786b47b8b4dc3da5248"],"arinogyouretsu":[1,"8c185c14c57530ba25e2d0340347eb4bc0b76effcafe6557d97ac786b6cdbb03","7311e8c2f8d30763cb520fe16a173f328a5c2c10c06e3cb9b55ce1c9b5cb2881"],"mikazukinokatana":[8,"0b58ec8f856cfa191c37c1f44ae7ff75c5b473b147e70f9ba10c871032ccc019","9ba02dbb4a43ff1bbdc67b227e09633fc55d0d8fb2cbbb1b72c274c5fabea4c4"],"suzurinonakanoumi":[2,"f656156359b77e4e359aa135438445f447c20aca8885f80acf435c16705caa02","7d6da0e7fda21a5a45e28c30e420e069163f5b1e93caf3b9652d7c83a8d8a72c"],"kagononakanokoe":[13,"323caa20d068ae13c9a634cb00cf28d42988dc818c11c6687dd3902fc77d348b","7c91f7d62be5ef2898227ddd623959341b80772aa9bb8dc885a6b7a3bda9cca0"],"kingyonome":[13,"08b76a0a590d2bcabcb0e68b28b22d31e171ee75f9e5869b4899e1a04829541d","765739f9be21b4d2da4c190c7810342ca12f1bc0e6553f0665afd888b2f8ad32"],"chounoigon":[2,"92808d5d6aa39be03f9b3f834367fb22af86e4b5f301b24404eb0497031fe1e6","166c7b4e244d4fa87050ff323576cb53014f605e9bae82d729f46f592b570caf"],"ishinokioku":[9,"a1b569bf10ec07f5de462a5bdcc3566954e84d73a1f7395fd07ee33d8bde68f4","9dabe48abcc9d454a87afa6335bf04f11284d5d4a38a44540a3942d5d308cc3b"],"shamisenborinotsuki":[5,"0534906996b28cab8da560dd512a31e7f408691f5e61d3131bcc1f865d31ed6b","234cbdc34cf603a3c4be6cfe9ca726fc056449061ca5d00ce2299d2a124e47be"],"tonbonomichishirube":[13,"23ff9fceee7eaa56867919bf37f185f4934d8eb41f996d7889db2b1f95789b9f","28229a87f92bd149029a752396f5c55ee28360a6a4ba865e84cbffde7a1c2571"],"takeboukinoodori":[12,"a60f627b250afe0678e319a2c218ded51952bda9cca117ed5a32afb81c59e7b2","43e69e20792959626102fce4ac95a79232d3a86f64d32b924bfd969b138ebef6"],"nawanorennokoe":[13,"34c1ddfd9abddc88bfec3e3ac76fe3274673aad27cbaaf980e544dcdf3c8b312","68243206043b7b941c36dd156132064011022209f774dac5f2dc9556be7bcd4a"],"choochinnokaeshiwasure":[15,"3a19dfaebc8e21c25435fb7a803404c10a461ce694e38da0aa30e6fac298b16b","6391e2aa296999818664f3ef15c5b6f6ae7ed637da7b8bb050f5f0dd55c8ec08"],"mukadenochuukoku":[12,"77be4571ca085bea80c7518667e8f695dd46fa4ff1c1c0565b05954aa9c58ff1","7736469d65003af5882918be0a57e3b0c1dc08a482f6a0bde4f5026ac48e841d"],"tsurunoongaeshinoato":[7,"db4723c993185a8f554c85a242f1659c5dfb3a9df895e9c4c5ecb67b30380677","5440c057fd353b09a2c3b2a9c3f9dfeb2a6b79a810a5a9cf016f3102883df04b"],"hyakumonogatarinohyakuichiwame":[3,"624190be1256af8ca5d7f69b0d4ab726bca14966ec27c32c0a44a5c5a588ffd0","9dbd03b4efaf970270b1e8a59cc857c453c6c2a13580fc52143639f2c40302e0"],"kageokuri":[9,"30cd586c4d0afedfd7b4188c426a37670bf5025adae6a11189de1a0961c5e748","10770d52a55c188e1ad9d00360ababd7fc774a552b2e028e4c30c3b429a20ca1"],"kujuukunohi":[9,"5e75983ca9e82a528283a1a97267f51775e17cf183c5e96585577db6ff028263","0c8fe5756f2ba42d2402db0e0ef6b7063d03f1e761ad234eb056bbc3e533dfc7"],"toushinnotsuzuki":[7,"b1601ef9f5a30cae9f8d3647cb425ae9a21d39cc976c90cc7237083c6999884c","f00ed8a44f5d117fcc3299c534b60714518ced493552dd8cd5afc5407043d1db"],"miyazakinohi":[3,"650c8797b3cfb863844afeb3c785d832014ac09c5ac6776bdcc76c8df2eccfcc","9e75160c97bf6e08d4a0b120672fe70d5d7d50401b7be6bf1b03211236e1a397"],"saigonotoushin":[3,"991039e380986bd8ec4f68ef7e0b35a0611365855c52809d70d7fe04bc7bdca3","08f9fe8021944ff8365d44f7a68f88dddf88e52a196540d315ce0bfaa393d664"]};
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
 const rubyCases=[["fumitsukai", "寛永通宝", 20, "d1eba7de418df93c2d827c8f61211765ea2058f91c178bd5afe7a3b1a5946ec4"], ["shamisen", "三味線", 11, "879ce8021d8501010eee1e6aea56cff6f6bbf791323d985cc28957df34a49f8f"], ["yuya", "湯女", 12, "0fbb48b8d97868e76794a1d702307b74528f9b60f782a2553b2bc30c32138a46"]];
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
