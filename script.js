document.addEventListener('DOMContentLoaded', function(){
(function(){
var el = document.getElementById('siteCatch');
if (!el) return;
var words = [
'今日から妖怪やる人がうらやましい',
'今日も妖怪やる人が微笑ましい',
'どうだ！妖怪楽しいだろう！？',
'あなたの妖怪もしりたい！',
'一緒に妖怪を語らおう！'
];
var n = 1;
try {
var key = 'yokai_visits';
var last = localStorage.getItem('yokai_last_day');
var today = new Date().toDateString();
n = parseInt(localStorage.getItem(key) || '0', 10);
if (last !== today) {
n = n + 1;
localStorage.setItem(key, String(n));
localStorage.setItem('yokai_last_day', today);
}
if (n < 1) n = 1;
} catch (e) {
n = 1; // プライベートモード等でlocalStorageが使えない場合は初回の言葉のまま
}
var idx = n >= words.length ? words.length - 1 : (n - 1);
el.textContent = words[idx];
})();
var revealEls = document.querySelectorAll('.reveal');
revealEls.forEach(function(el, i){
el.style.transitionDelay = Math.min(i * 35, 420) + 'ms';
});
var ledeEl = document.querySelector('body.creative-work .record-lede');
if (ledeEl) ledeEl.classList.add('reveal-text');
var creativeParas = document.querySelectorAll('body.creative-work .record-body .reveal-text');
creativeParas.forEach(function(el, i){
el.style.transitionDelay = Math.min(i * 90, 540) + 'ms';
});
var revealTextEls = document.querySelectorAll('.reveal-text');
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduce || !('IntersectionObserver' in window)) {
revealEls.forEach(function(el){ el.classList.add('is-visible'); });
revealTextEls.forEach(function(el){ el.classList.add('is-visible'); });
return;
}
var io = new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if (entry.isIntersecting) {
entry.target.classList.add('is-visible');
io.unobserve(entry.target);
}
});
}, {threshold: 0.08, rootMargin: '0px 0px -30px 0px'});
revealEls.forEach(function(el){ io.observe(el); });
var ioText = new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if (entry.isIntersecting) {
entry.target.classList.add('is-visible');
ioText.unobserve(entry.target);
}
});
}, {threshold: 0.1, rootMargin: '0px 0px -40px 0px'});
revealTextEls.forEach(function(el){ ioText.observe(el); });
var slideEls = Array.prototype.slice.call(document.querySelectorAll('.region-slide'));
if (slideEls.length) {
if (reduce) {
slideEls.forEach(function(el){ el.classList.add('is-visible'); });
} else {
var checkSlideEls = function(){
var winH = window.innerHeight;
slideEls = slideEls.filter(function(el){
var panelBody = el.closest('.pref-panel-body');
if (panelBody) {
var panelRect = panelBody.getBoundingClientRect();
var elRect0 = el.getBoundingClientRect();
if (elRect0.top - panelRect.top >= panelRect.height) {
return true; // まだ監視対象として残す
}
}
var rect = el.getBoundingClientRect();
if (rect.top < winH - 40 && rect.bottom > 0) {
el.classList.add('is-visible');
return false; // 発火済みなので以後の監視対象から外す
}
return true;
});
if (!slideEls.length) {
window.removeEventListener('scroll', onSlideScroll);
}
};
var slideTicking = false;
var onSlideScroll = function(){
if (!slideTicking) {
slideTicking = true;
requestAnimationFrame(function(){ checkSlideEls(); slideTicking = false; });
}
};
checkSlideEls();
window.addEventListener('scroll', onSlideScroll, {passive:true});
}
}
var flyEls = Array.prototype.slice.call(document.querySelectorAll('.card-place'));
if (flyEls.length) {
if (reduce) {
flyEls.forEach(function(el){ el.classList.add('is-visible'); });
} else {
var checkFlyEls = function(){
var winH = window.innerHeight;
flyEls = flyEls.filter(function(el){
var rect = el.getBoundingClientRect();
if (rect.top < winH - 60 && rect.bottom > 0) {
el.classList.add('is-visible');
return false;
}
return true;
});
if (!flyEls.length) {
window.removeEventListener('scroll', onFlyScroll);
}
};
var flyTicking = false;
var onFlyScroll = function(){
if (!flyTicking) {
flyTicking = true;
requestAnimationFrame(function(){ checkFlyEls(); flyTicking = false; });
}
};
checkFlyEls();
window.addEventListener('scroll', onFlyScroll, {passive:true});
}
}
document.querySelectorAll('.pref-panel-toggle').forEach(function(btn){
var body = btn.nextElementSibling;
var labelSpan = btn.querySelector('span');
btn.addEventListener('click', function(){
var expanded = btn.getAttribute('aria-expanded') === 'true';
if (expanded) {
btn.setAttribute('aria-expanded', 'false');
body.style.maxHeight = '0px';
labelSpan.textContent = '47都道府県の一覧を開く';
} else {
btn.setAttribute('aria-expanded', 'true');
body.style.maxHeight = body.scrollHeight + 'px';
labelSpan.textContent = '47都道府県の一覧を閉じる';
var firstSlide = body.querySelector('.region-slide');
if (firstSlide) firstSlide.classList.add('is-visible');
}
});
});
var twBlocks = document.querySelectorAll('.tw-block');
if (twBlocks.length) {
twBlocks.forEach(function(block){
var lines = Array.prototype.slice.call(block.querySelectorAll('.tw-line'));
var originals = lines.map(function(el){ return el.innerHTML; });
if (!reduce) { lines.forEach(function(el){ el.innerHTML = ''; }); }
block.__twLines = lines;
block.__twOriginals = originals;
});
var runTypewriter = function(block){
var lines = block.__twLines, originals = block.__twOriginals, li = 0;
var typeLine = function(){
if (li >= lines.length) { return; }
var el = lines[li], html = originals[li], i = 0, built = '';
var step = function(){
if (i >= html.length) {
el.innerHTML = built;
li++;
setTimeout(typeLine, 260);
return;
}
if (html[i] === '<') {
var close = html.indexOf('>', i);
if (close === -1) { close = html.length - 1; }
built += html.slice(i, close + 1);
i = close + 1;
} else {
built += html[i];
i++;
}
el.innerHTML = built + '<span class="tw-cursor"></span>';
setTimeout(step, 26 + Math.random() * 30);
};
step();
};
typeLine();
};
if (reduce || !('IntersectionObserver' in window)) {
twBlocks.forEach(function(block){
block.__twLines.forEach(function(el, idx){ el.innerHTML = block.__twOriginals[idx]; });
});
} else {
var ioType = new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if (entry.isIntersecting) {
runTypewriter(entry.target);
ioType.unobserve(entry.target);
}
});
}, {threshold: 0.2, rootMargin: '0px 0px -60px 0px'});
twBlocks.forEach(function(block){ ioType.observe(block); });
}
}
(function(){
var page = document.getElementById('profilePage');
var bar = document.getElementById('pmodeBar');
if (!page || !bar) return;
var note = document.getElementById('pmodeNote');
var hint = document.getElementById('pmodeHint');
var _isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;
var modes = {
'default': {name:'誰もいない',
note:'今は誰も憑いていない。普通に読める。',
hint:''},
'kamaitachi': {name:'鎌鼬（かまいたち）',
note:'文字が斜めに切られている。切断面が横にずれているので、上下を目で繋いで読むことになる。',
hint:'文字が切られています。切り口で上下がずれています'},
'nurikabe': {name:'塗り壁（ぬりかべ）',
note:'段落の先に壁が立って、続きが読めない。壁に触れると崩れる。柳田國男の記録では、壁の下の方を棒で叩くと消えるという。',
hint:'灰色の壁をタップまたはマウスで触れると崩れます'},
'kitsunebi': {name:'狐火（きつねび）',
note:'闇の中。読もうとした箇所だけに火がともる。',
hint:'読みたい段落をタップまたはマウスで触れると、そこだけ火がともります'},
'yanari': {name:'家鳴（やなり）',
note:'小鬼が家を揺すっている。文字が絶えず細かく震える。触れているあいだだけ止まる。',
hint:'揺れが気になる段落をタップまたはマウスで触れると、その段落だけ止まります'},
'akaname': {name:'垢嘗（あかなめ）',
note:'文字が舐められて、ほとんど消えている。触れると戻る。',
hint:'薄くなった段落をタップまたはマウスで触れると戻ります'},
'mokumokuren': {name:'目目連（もくもくれん）',
note:'文字の隙間から、無数の目が見ている。読んでいる側が見られている。',
hint:'読んでいるあいだ、こちらも見られています'},
'hakushi': {name:'白紙',
note:'何も書かれていないように見える。どの妖怪の仕業かは分かっていない。',
hint:'文字を選択（ドラッグ）するか、上の「あきらめて読む」を押すと読めます'}
};
var order = ['default','kamaitachi','nurikabe','kitsunebi','yanari','akaname','mokumokuren','hakushi'];
function buildKama(){
Array.prototype.forEach.call(page.querySelectorAll('p:not(.pmode-hint), li'), function(el){
if (el.dataset.kamaDone) return;
el.dataset.kamaDone = '1';
var html = el.innerHTML;
var wrap = document.createElement('span');
wrap.className = 'kama-wrap';
wrap.innerHTML =
'<span class="kama-base">' + html + '</span>' +
'<span class="kama-a">' + html + '</span>' +
'<span class="kama-b">' + html + '</span>' +
'<span class="kama-slash"></span>';
el.innerHTML = '';
el.appendChild(wrap);
});
}
function buildYanari(){
Array.prototype.forEach.call(page.querySelectorAll('p:not(.pmode-hint), li, h2, h3'), function(el){
if (el.dataset.yanariDone) return;
el.dataset.yanariDone = '1';
var sp = document.createElement('span');
sp.className = 'yanari-in';
while (el.firstChild) sp.appendChild(el.firstChild);
el.appendChild(sp);
});
}
function buildWall(){
var cands = [];
Array.prototype.forEach.call(page.querySelectorAll('p:not(.pmode-hint), li'), function(el){
var txt = (el.textContent || '').trim();
if (txt.length < 40) return;              // 短い行は一行で終わり、右が空く
var cs = window.getComputedStyle(el);
var lh = parseFloat(cs.lineHeight);
if (!lh || isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.8;
var h = el.getBoundingClientRect().height;
if (h < lh * 1.8) return;                 // 二行に届かないものは除く
cands.push(el);
});
var step = Math.max(1, Math.floor(cands.length / 3));
for (var i = 0; i < cands.length; i += step) {
cands[i].classList.add('nuri-wall');
if (page.querySelectorAll('.nuri-wall').length >= 3) break;
}
if (!page.querySelector('.nuri-wall')) {
var longest = null, max = 0;
Array.prototype.forEach.call(page.querySelectorAll('p:not(.pmode-hint)'), function(el){
var n = (el.textContent || '').length;
if (n > max) { max = n; longest = el; }
});
if (longest) longest.classList.add('nuri-wall');
}
}
function clearTricks(){
page.classList.remove('is-revealed');
Array.prototype.forEach.call(page.querySelectorAll('.yanari-in'), function(sp){
var host = sp.parentNode;
if (host) {
while (sp.firstChild) host.insertBefore(sp.firstChild, sp);
host.removeChild(sp);
delete host.dataset.yanariDone;
}
});
Array.prototype.forEach.call(page.querySelectorAll('.kama-wrap'), function(w){
var base = w.querySelector('.kama-base');
var host = w.parentNode;
if (base && host) {
host.innerHTML = base.innerHTML;
delete host.dataset.kamaDone;
}
});
Array.prototype.forEach.call(page.querySelectorAll('.is-shown'), function(el){
el.classList.remove('is-shown');
});
Array.prototype.forEach.call(page.querySelectorAll('.nuri-wall'), function(el){
el.classList.remove('nuri-wall', 'is-broken');
});
}
function apply(mode, remember){
if (!modes[mode]) mode = 'default';
clearTricks();
page.setAttribute('data-pmode', mode);
if (mode === 'kamaitachi') buildKama();
if (mode === 'nurikabe') buildWall();
if (mode === 'yanari') buildYanari();
Array.prototype.forEach.call(bar.querySelectorAll('.pmode-btn'), function(b){
b.setAttribute('aria-pressed', b.getAttribute('data-pmode') === mode ? 'true' : 'false');
});
var m = modes[mode];
if (note) {
note.textContent = (mode === 'default')
? m.note + '（このページには、訪れるたびに違う妖怪がいます）'
: '今このページには' + m.name + 'がいます。' + m.note;
}
if (hint) {
hint.textContent = m.hint;
}
var rv = document.getElementById('pmodeReveal');
if (mode === 'hakushi') {
if (!rv) {
rv = document.createElement('button');
rv.type = 'button'; rv.id = 'pmodeReveal'; rv.className = 'pmode-btn';
rv.textContent = 'あきらめて読む';
rv.addEventListener('click', function(){ page.classList.add('is-revealed'); });
bar.insertBefore(rv, note);
}
rv.style.display = '';
} else if (rv) {
rv.style.display = 'none';
}
if (remember) {
try { localStorage.setItem('yokai_pmode', mode); } catch (e) {}
}
}
var saved = null, prev = null;
try {
saved = localStorage.getItem('yokai_pmode');
prev = localStorage.getItem('yokai_pmode_prev');
} catch (e) {}
var pick;
if (saved) {
pick = saved;   // 前回ボタンで選んだ読ませ方を覚えている
} else {
var pool = order.filter(function(m){ return m !== prev; });
pick = pool[Math.floor(Math.random() * pool.length)];
try { localStorage.setItem('yokai_pmode_prev', pick); } catch (e) {}
}
apply(pick, false);
Array.prototype.forEach.call(bar.querySelectorAll('.pmode-btn'), function(b){
b.addEventListener('click', function(){
apply(b.getAttribute('data-pmode'), true);
});
});
page.addEventListener('click', function(ev){
var pm = page.getAttribute('data-pmode');
if (pm !== 'akaname') return;
var el = ev.target.closest('p, ul, ol');
if (el && page.contains(el)) el.classList.add('is-shown');
});
page.addEventListener('click', function(ev){
var pm = page.getAttribute('data-pmode');
if (pm !== 'kitsunebi' && pm !== 'yanari') return;
var el = ev.target.closest('p, ul, ol, h2, h3, li');
if (!el || !page.contains(el)) return;
var top = el;
while (top.parentNode && top.parentNode !== page) top = top.parentNode;
top.classList.toggle('is-shown');
});
page.addEventListener('click', function(ev){
if (page.getAttribute('data-pmode') !== 'nurikabe') return;
var el = ev.target.closest('.nuri-wall');
if (el) el.classList.add('is-broken');
});
})();
(function(){
var block = document.getElementById('featureCreative');
if (!block) return;
var note = document.getElementById('featureHueNote');
var hues = [
{id:'kitsunebi',   name:'狐火',     desc:'夜の野山にともる、正体の知れない火の色'},
{id:'hakutaku',    name:'白澤',     desc:'万物に通じる瑞獣。護符に刷られた紙と墨の色'},
{id:'nekomata',    name:'猫又',     desc:'漆黒に金。行灯の油を舐める、老猫の目の色'},
{id:'mokumokuren', name:'目目連',   desc:'荒れた家の障子に浮かぶ、無数の目の色'},
{id:'ushioni',     name:'牛鬼',     desc:'海辺に出る牛鬼。深い朱に、生成りの角の色'},
{id:'yukionna',    name:'雪女',     desc:'吹雪の向こうに立つ女。雪の白と、薄墨の影'},
{id:'nurikabe',    name:'ぬりかべ', desc:'夜道をふさぐ壁。色を持たず、輪郭だけがある'},
{id:'yamabiko',    name:'山びこ',   desc:'声を返す山。深い緑に、若草の差し色'}
];
var prev = null;
try { prev = localStorage.getItem('yokai_hue'); } catch (e) {}
var pool = hues.filter(function(h){ return h.id !== prev; });
if (!pool.length) pool = hues;
var pick = pool[Math.floor(Math.random() * pool.length)];
block.setAttribute('data-hue', pick.id);
try { localStorage.setItem('yokai_hue', pick.id); } catch (e) {}
if (note) {
note.textContent = 'この区画の色は、訪れるたびに変わります。今回は「' + pick.name + '」。' + pick.desc + '。';
}
})();
(function(){
var slider = document.getElementById('jrkRate');
if (!slider) return;
var crash = document.getElementById('jrkCrash');
var winRow = document.getElementById('jrkWinRow');
var el = {
val: document.getElementById('jrkRateVal'), desc: document.getElementById('jrkRateDesc'),
rank: document.getElementById('jrkRank'), wealth: document.getElementById('jrkWealth'),
trust: document.getElementById('jrkTrust'),
ftrue: document.getElementById('jrkTrue'), fun: document.getElementById('jrkFun'),
money: document.getElementById('jrkMoney'), listeners: document.getElementById('jrkListeners'),
autonomy: document.getElementById('jrkAutonomy'), happy: document.getElementById('jrkHappy'),
health: document.getElementById('jrkHealth'), verdict: document.getElementById('jrkVerdict'),
chart: document.getElementById('jrkChart')
};
function career(){
var r = document.querySelector('input[name="jrkCareer"]:checked');
return r ? r.value : 'employee';
}
function wins(){
var r = document.querySelector('input[name="jrkWin"]:checked');
return r ? parseInt(r.value, 10) : 0;
}
function simulate(r, founder, bigWins, doCrash){
var rank = 1.0, wealth = 300.0, trust = 1.0;
var fMoney = 4.0, fFun = 10.0, fTrue = 8.0;
var winYears = [];
if (founder && bigWins > 0) {
for (var i = 0; i < bigWins; i++) {
winYears.push(6 + Math.floor(28 * (i + 0.5) / bigWins));
}
}
var log = [], relSat50 = null;
for (var y = 0; y < 40; y++) {
var age = 25 + y;
if (doCrash && y === 35) { wealth *= 0.35; rank *= 0.25; }
if (winYears.indexOf(y) >= 0) {
wealth *= 2.6; rank += 1.2;
trust = Math.max(0, trust - 0.04);   // 拡大は関係を犠牲にしがち
}
if (founder) { rank += (0.13 + r * 0.16) * (0.60 + trust * 0.40); }
else         { rank += (0.10 + r * 0.22) * (0.55 + trust * 0.45); }
var base = 38 + r * 16;
if (founder) {
base *= 1.15;
if (y % 7 === 3) { wealth *= 0.92; }   // 起業の損失（生存率統計）
}
wealth += rank * base;
var entropy = r * 0.045;
if (trust < 0.5) { entropy *= 1.35; }
trust = Math.max(0, Math.min(1, trust - entropy + (1 - r) * 0.020));
fMoney = Math.min(4.0 + Math.sqrt(wealth) * 0.11 * (0.35 + r * 0.65), 50);
var funTarget = (8.0 + rank * 0.8) * (0.25 + trust * 0.75);
fFun += (funTarget - fFun) * 0.18;
fFun = Math.max(0, Math.min(fFun, 15));
if (trust < 0.78) { fTrue -= (0.78 - trust) * 1.9; }
fTrue += (1 - r) * 0.22;
fTrue = Math.max(0, Math.min(fTrue, 15));
var listeners = Math.min(fTrue * trust * (1 / (1 + rank * 0.14)), 5);
var autonomy;
if (founder) { autonomy = Math.min(1, 0.55 + rank * 0.03 + Math.log(Math.max(wealth,1))/Math.LN10 * 0.06); }
else         { autonomy = Math.min(1, 0.25 + rank * 0.045 + Math.log(Math.max(wealth,1))/Math.LN10 * 0.04); }
if (doCrash && y >= 35) { autonomy *= 0.7; }
var relatedness = Math.min(1, listeners / 4.5);
var competence = Math.min(1, rank / 9);
var moneyTerm = Math.log(Math.max(wealth,100) / 100) / Math.LN10 / 3.2;
var happiness = moneyTerm * 0.26 * (0.4 + autonomy * 0.6)
+ relatedness * 0.44 + competence * 0.14 + autonomy * 0.16;
happiness = Math.max(0, Math.min(1, happiness));
if (age === 50) { relSat50 = relatedness; }
log.push({age: age, rank: rank, wealth: wealth, trust: trust,
fMoney: fMoney, fFun: fFun, fTrue: fTrue, listeners: listeners,
autonomy: autonomy, happiness: happiness});
}
var rs = (relSat50 === null) ? 0 : relSat50;
var health = 0.20 + rs * 0.58 + log[log.length-1].trust * 0.14;
log.forEach(function(d){ d.health = health; });
return log;
}
function describe(pct){
if (pct === 0)   return '一度も自分を優先しなかった場合。';
if (pct <= 20)   return '多くの場面で相手を立てる。';
if (pct <= 40)   return '譲ることが多い。';
if (pct <= 55)   return '半々。';
if (pct <= 70)   return '自分を優先することが多い。';
if (pct <= 85)   return 'ほとんど譲らない。';
return '一度も譲らなかった場合。';
}
function verdict(d, log, doCrash){
var oku = (d.wealth / 10000).toFixed(1);
var s = '65歳時点。資産' + oku + '億、地位' + d.rank.toFixed(1) + '、信頼' + d.trust.toFixed(2) + '。';
s += '本音を言える友人' + d.fTrue.toFixed(1) + '人、楽しいからの友人' + d.fFun.toFixed(1) + '人、お金でつながる友人' + d.fMoney.toFixed(1) + '人、';
s += '話を最後まで聞いてくれる人' + d.listeners.toFixed(1) + '人。';
s += '幸福度' + d.happiness.toFixed(2) + '、80歳時点の健康' + d.health.toFixed(2) + '。';
if (doCrash) {
var b = log[34];
var dl = d.listeners - b.listeners;
s += '（失脚の前後で、話を聞いてくれる人が' + (dl >= 0 ? '+' : '') + dl.toFixed(1) + '人）';
}
if (d.listeners < 0.5) { s += 'この状態を、この台帳では常利己と呼んでいる。'; }
return s;
}
function drawChart(log){
var W = 640, H = 260, pad = {l: 40, r: 14, t: 14, b: 26};
var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
var maxPeople = 30;
var maxRank = Math.max(11, Math.ceil(log[log.length-1].rank * 1.1));
function x(i){ return pad.l + (i / 39) * iw; }
function yR(v){ return pad.t + ih - (Math.min(v, maxRank) / maxRank) * ih; }
function yP(v){ return pad.t + ih - (Math.min(v, maxPeople) / maxPeople) * ih; }
function path(key, fn){
return log.map(function(d, i){
return (i === 0 ? 'M' : 'L') + x(i).toFixed(1) + ',' + fn(d[key]).toFixed(1);
}).join(' ');
}
var s = '';
s += '<line class="jrk-axis" x1="' + pad.l + '" y1="' + (pad.t + ih) + '" x2="' + (W - pad.r) + '" y2="' + (pad.t + ih) + '"/>';
[25, 35, 45, 55, 64].forEach(function(age){
s += '<text class="jrk-tick" x="' + x(age - 25).toFixed(0) + '" y="' + (H - 8) + '" text-anchor="middle">' + age + '歳</text>';
});
[0, 10, 20, 30].forEach(function(v){
s += '<line class="jrk-axis" x1="' + pad.l + '" y1="' + yP(v).toFixed(1) + '" x2="' + (W - pad.r) + '" y2="' + yP(v).toFixed(1) + '" opacity="0.3"/>';
s += '<text class="jrk-tick" x="' + (pad.l - 6) + '" y="' + (yP(v) + 3).toFixed(1) + '" text-anchor="end">' + v + '人</text>';
});
s += '<path class="jrk-line-rank" d="' + path('rank', yR) + '"/>';
s += '<path class="jrk-line-money" d="' + path('fMoney', yP) + '"/>';
s += '<path class="jrk-line-fun" d="' + path('fFun', yP) + '"/>';
s += '<path class="jrk-line-friends" d="' + path('fTrue', yP) + '"/>';
s += '<path class="jrk-line-listeners" d="' + path('listeners', yP) + '"/>';
el.chart.innerHTML = s;
}
function update(){
var pct = parseInt(slider.value, 10);
var founder = (career() === 'founder');
if (winRow) { winRow.classList.toggle('is-off', !founder); }
var log = simulate(pct / 100, founder, founder ? wins() : 0, crash && crash.checked);
var d = log[log.length - 1];
el.val.textContent = pct;
el.desc.textContent = describe(pct);
el.rank.textContent = d.rank.toFixed(1);
el.wealth.textContent = Math.round(d.wealth).toLocaleString() + '万';
el.trust.textContent = d.trust.toFixed(2);
el.ftrue.textContent = d.fTrue.toFixed(1) + '人';
el.fun.textContent = d.fFun.toFixed(1) + '人';
el.money.textContent = d.fMoney.toFixed(1) + '人';
el.listeners.textContent = d.listeners.toFixed(1) + '人';
el.autonomy.textContent = d.autonomy.toFixed(2);
el.happy.textContent = d.happiness.toFixed(2);
el.health.textContent = d.health.toFixed(2);
el.verdict.textContent = verdict(d, log, crash && crash.checked);
drawChart(log);
}
slider.addEventListener('input', update);
if (crash) crash.addEventListener('change', update);
document.querySelectorAll('input[name="jrkCareer"], input[name="jrkWin"]').forEach(function(r){
r.addEventListener('change', update);
});
update();
})();
(function(){
var btn = document.getElementById('navToggle');
var drawer = document.getElementById('navDrawer');
var overlay = document.getElementById('navOverlay');
var closeBtn = document.getElementById('navClose');
if (!btn || !drawer || !overlay) return;
function open(){
drawer.hidden = false; overlay.hidden = false;
requestAnimationFrame(function(){
drawer.classList.add('is-open');
overlay.classList.add('is-open');
});
btn.setAttribute('aria-expanded', 'true');
btn.setAttribute('aria-label', 'メニューを閉じる');
document.body.classList.add('nav-locked');
closeBtn.focus();
}
function close(){
drawer.classList.remove('is-open');
overlay.classList.remove('is-open');
btn.setAttribute('aria-expanded', 'false');
btn.setAttribute('aria-label', 'メニューを開く');
document.body.classList.remove('nav-locked');
setTimeout(function(){
if (!drawer.classList.contains('is-open')) { drawer.hidden = true; overlay.hidden = true; }
}, 400);
btn.focus();
}
btn.addEventListener('click', function(){
if (btn.getAttribute('aria-expanded') === 'true') { close(); } else { open(); }
});
closeBtn.addEventListener('click', close);
overlay.addEventListener('click', close);
document.addEventListener('keydown', function(e){
if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') close();
});
})();
(function(){
if (reduce) return;  // 動きを減らす設定の人には即時移動のまま
function nurori(t){
return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}
var links = document.querySelectorAll('a.sd-link[href^="#"], a[href^="#sec-"], a[href^="#cat-"]');
links.forEach(function(a){
a.addEventListener('click', function(e){
var id = a.getAttribute('href').slice(1);
var target = document.getElementById(id);
if (!target) return;
e.preventDefault();
var startY = window.scrollY;
var endY = target.getBoundingClientRect().top + window.scrollY - 80;
var dist = Math.abs(endY - startY);
var duration = Math.min(1400, Math.max(600, dist * 0.55));
var startTime = null;
function step(ts){
if (!startTime) startTime = ts;
var p = Math.min((ts - startTime) / duration, 1);
window.scrollTo(0, Math.round(startY + (endY - startY) * nurori(p)));
if (p < 1) { requestAnimationFrame(step); }
else { history.replaceState(null, '', '#' + id); }
}
requestAnimationFrame(step);
});
});
})();
var topBtn = document.getElementById('yokai-top-btn');
if (topBtn) {
var showThreshold = 480;
var toggleBtn = function(){
if (window.scrollY > showThreshold) { topBtn.classList.add('is-visible'); }
else { topBtn.classList.remove('is-visible'); }
};
toggleBtn();
window.addEventListener('scroll', toggleBtn, {passive:true});
topBtn.addEventListener('click', function(){
if (reduce) { window.scrollTo(0,0); return; }
topBtn.classList.remove('is-nurori');
void topBtn.offsetWidth;
topBtn.classList.add('is-nurori');
var startY = window.scrollY;
var startTime = null;
var duration = Math.min(900, Math.max(500, startY * 0.6));
function easeNurori(t){
return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
}
function step(ts){
if (!startTime) startTime = ts;
var progress = Math.min((ts - startTime) / duration, 1);
var eased = easeNurori(progress);
window.scrollTo(0, Math.round(startY * (1 - eased)));
if (progress < 1) { requestAnimationFrame(step); }
}
requestAnimationFrame(step);
});
}
var parallaxImgs = document.querySelectorAll('.parallax-img');
if (parallaxImgs.length) {
var pTicking = false;
var updateParallax = function(){
var winH = window.innerHeight;
parallaxImgs.forEach(function(img){
var container = img.parentElement;
var rect = container.getBoundingClientRect();
if (rect.bottom < -300 || rect.top > winH + 300) { return; }
if (reduce) { img.style.transform = 'translateY(0)'; return; }
var overflowPx = img.offsetHeight - container.offsetHeight;
var maxOffset = Math.max(overflowPx / 2, 40);
var totalTravel = winH + rect.height;
var traveled = winH - rect.top;
var progress = traveled / totalTravel;
progress = Math.max(0, Math.min(1, progress));
var offset = maxOffset - progress * (maxOffset * 2);
img.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
});
pTicking = false;
};
var onParallaxScroll = function(){
if (!pTicking) {
pTicking = true;
requestAnimationFrame(updateParallax);
}
};
updateParallax();
window.addEventListener('scroll', onParallaxScroll, {passive:true});
window.addEventListener('resize', onParallaxScroll, {passive:true});
window.addEventListener('orientationchange', onParallaxScroll, {passive:true});
window.addEventListener('load', updateParallax);
}
});