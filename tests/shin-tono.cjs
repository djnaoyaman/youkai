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
assert.equal(stories.length,5);
for(const story of stories){
 const body=story.paragraphs.map(p=>`<p>${p}</p>`).join('\n');
 assert(read(`shin-tono/${story.slug}.html`).includes(`<article class="tono-reading" aria-label="${story.title} 本文">${body}</article>`),`${story.title}: published prose matches source data`);
}
console.log('PASS: original text preserved, 119 chapters, 5 stories, local links and anchors, unique ids.');
