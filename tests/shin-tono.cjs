const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const original=read('shin-tono/original.html');
assert.equal([...original.matchAll(/id="story-\d+"/g)].length,119);
for(let n=1;n<=119;n++)assert(original.includes(`href="#story-${n}"`));
// Compare all prose, ruby and editorial notes, ignoring presentation-only headings/images.
const normalize=s=>s.replace(/<h[23]\b[^>]*>[\s\S]*?<\/h[23]>/g,'').replace(/<img\b[^>]*>/g,'').replace(/<a class="tono-source-image"[^>]*>[\s\S]*?<\/a>/g,'').replace(/<[^>]+>/g,'').replace(/\s/g,'');
const source=read('source-materials/tono-aozora-utf8.txt');
const sourceBody=source.slice(source.indexOf('<div class="main_text">')+23,source.indexOf('<div class="bibliographical_information">'));
const outputBody=original.match(/<article class="tono-reading tono-original">([\s\S]*?)<\/article>/)[1];
assert.equal(normalize(outputBody),normalize(sourceBody),'original prose/ruby/notes preserved');
const files=['shin-tono.html',...fs.readdirSync(path.join(root,'shin-tono')).filter(p=>p.endsWith('.html')).map(p=>'shin-tono/'+p)];
for(const p of files){
 const s=read(p),ids=[...s.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size,`${p}: unique ids`);
 assert.equal((s.match(/<div\b/g)||[]).length,(s.match(/<\/div>/g)||[]).length,`${p}: balanced div wrappers`);
 assert(s.includes('<div class="wrap tono-wrap tono-footer-wrap"><footer'),`${p}: footer shares the content width`);
 assert(s.includes('lang="ja"')&&s.includes('id="main"'));
 for(const m of s.matchAll(/(?:href|src)="([^"\s]+)"/g)){
  if(/^(https?:|mailto:|#|data:)/.test(m[1]))continue;
  const [target,fragment]=m[1].split('#'),full=path.resolve(root,path.dirname(p),target);
  assert(fs.existsSync(full),`${p}: ${m[1]} exists`);
  if(fragment)assert(fs.readFileSync(full,'utf8').includes(`id="${fragment}"`),`${p}: ${fragment} exists`);
 }
}
const stories=JSON.parse(read('shin-tono-data.json'));
const {plain,readings,glossary,annotate,renderParagraphs,validDate}=require('../shin-tono-editorial.cjs');
assert(stories.length>=5,'the five complete stories remain present');
const home=read('index.html'),entry=read('shin-tono.html'),sources=plain(read('shin-tono/sources.html'));
const announcement=home.match(/<a\b[^>]*id="serialAnnouncement"[\s\S]*?<\/a>/)[0];
assert(announcement.includes(`全${stories.length}話を読む`),'homepage accessible announcement has current count');
assert(announcement.includes(`全${stories.length}話を掲載`),'homepage visible announcement has current count');
const cards=[...entry.matchAll(/<a class="tono-card"[\s\S]*?<\/a>/g)].map(m=>m[0]);
assert.equal(cards.length,stories.length,'one collection card per story');
const urls=[...read('sitemap.xml').matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>[\s\S]*?<\/url>/g)];
const llms=read('llms.txt');
assert(llms.includes(`現代の創作、全${stories.length}話`),'reader/AI guide has current count');
const baseUrl='https://djnaoyaman.github.io/youkai/';
function sitemapDate(file,date){
 const matches=urls.filter(m=>m[1]===baseUrl+file);
 assert.equal(matches.length,1,`${file}: one sitemap entry`);
 assert.equal(matches[0][2],date,`${file}: sitemap date agrees`);
}
const collectionDate=stories.map(s=>validDate(s.updatedAt)).sort().at(-1);
sitemapDate('shin-tono.html',collectionDate);
sitemapDate('shin-tono/sources.html',collectionDate);
sitemapDate('shin-tono/original.html','2026-11-08');
for(const [i,story] of stories.entries()){
 validDate(story.updatedAt);validDate(story.sourceCheckedAt);
 const file=`shin-tono/${story.slug}.html`,html=read(file);
 const body=html.match(/<article class="tono-reading"[^>]*>([\s\S]*?)<\/article>/)[1];
 assert.equal(plain(body),plain(story.paragraphs.map(p=>`<p>${p}</p>`).join('\n')),`${story.title}: ruby preserves all prose`);
 assert.equal(body,renderParagraphs(story.paragraphs),`${story.title}: readings are current`);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.dateModified,story.updatedAt,`${story.title}: metadata date agrees`);
 assert.equal(schema.name,story.title,`${story.title}: metadata keeps a plain title`);
 assert(plain(cards[i]).includes(story.title)&&plain(cards[i]).includes(plain(story.lead)),`${story.title}: card text is current`);
 assert(sources.includes(plain(story.invented))&&sources.includes(plain(story.evidence)),`${story.title}: source notes are current`);
 const navigation=html.match(/<nav class="tono-next"[^>]*>([\s\S]*?)<\/nav>/)[1];
 assert(navigation.includes(`href="${i?stories[i-1].slug+'.html':'../shin-tono.html'}"`),`${story.title}: previous story`);
 assert(navigation.includes(`href="${i<stories.length-1?stories[i+1].slug+'.html':'../shin-tono.html'}"`),`${story.title}: next story`);
 sitemapDate(file,story.updatedAt);
 assert(llms.includes(baseUrl+file),`${story.title}: listed in reader/AI guide`);
 for(const [term,reading] of Object.entries(readings)){
  if(!plain(body).includes(term))continue;
  // A longer compound can contain the same characters, so require at most one standalone ruby.
  const expected=`<ruby>${term}<rt>${reading}</rt></ruby>`;
  assert(body.split(expected).length-1<=1,`${story.title}: ${term} annotated only at first use`);
 }
 for(const term of Object.keys(glossary))if(plain(body).includes(term))assert(html.includes('ことばの補足')&&plain(html).includes(glossary[term]),`${story.title}: ${term} has a short explanation`);
 for(const quote of plain(body).matchAll(/「([^「」]+)」/g))assert(!/(?:ますか|ですか|だろうか|何時にする|いつ帰ってくる|誰の田|鍵は|お母さんは|その前|かね)$/.test(quote[1]),`${story.title}: direct question needs ？: ${quote[1]}`);
}
assert(read('shin-tono/mizu-no-junban.html').includes('「下って、誰の田？」'));
assert(read('shin-tono/togi-dai.html').includes('<ruby>鉈<rt>なた</rt></ruby>'));
assert(read('shin-tono/togi-dai.html').includes('<ruby>砥石<rt>といし</rt></ruby>'));
assert(read('shin-tono/mizu-no-junban.html').includes('<ruby>取水口<rt>しゅすいこう</rt></ruby>'));
assert.equal(annotate(annotate('鉈と砥石')),annotate('鉈と砥石'),'annotation is idempotent');
for(const file of files)assert(!/<ruby\b[^>]*>(?:(?!<\/ruby>)[\s\S])*<ruby\b/.test(read(file)),`${file}: no nested ruby`);
console.log(`PASS: original preserved; ${stories.length} stories, questions/readings, glossary, cards, navigation, source notes, dates, sitemap and guide agree.`);
