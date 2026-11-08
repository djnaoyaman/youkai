const fs = require('node:fs');
const path = require('node:path');

// Add only readings that are known. Unverified local names are not guessed.
const readings = Object.freeze({
  '東長岡':'ひがしながおか', '片寄':'かたよせ', '潟沼':'かたぬま',
  '滝名川':'たきながわ', '山屋':'やまや', '桜町':'さくらまち',
  '亮':'りょう', '裕子':'ゆうこ', '美緒':'みお', 'お駒':'おこま',
  '研ぎ代':'とぎだい', '研ぎ台':'とぎだい', '戸口':'とぐち',
  '取水口':'しゅすいこう', '水口':'みなくち', '畦':'あぜ',
  '鉈':'なた', '砥石':'といし', '薪':'まき', '鍛冶屋':'かじや',
  '秤':'はかり', '浅瀬':'あさせ', '針金':'はりがね', '掌':'てのひら',
  '猟師':'りょうし', '大蛇':'だいじゃ', '供養':'くよう', '地蔵':'じぞう',
  '渇水':'かっすい', '蕗':'ふき', '膳':'ぜん', '椀':'わん', '穀物':'こくもつ'
});
const glossary = Object.freeze({
  '取水口':'水路から田へ、水を取り込む入口。',
  '水口':'田へ水が入るところ。',
  '畦':'田の周りに土を盛って作る境目。',
  '鉈':'木や薪を切ったり割ったりする、厚い刃の道具。',
  '砥石':'刃物を研ぐための石。',
  '秤':'物の重さを量る道具。',
  '鍛冶屋':'金属を熱して打ち、刃物や農具などを作る職人や店。'
});
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matcher = new RegExp(Object.keys(readings).sort((a,b)=>b.length-a.length).map(escapeRegex).join('|'), 'g');
function plain(text) {
  return text.replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/g, '').replace(/<[^>]+>/g, '');
}
function annotate(text, seen = new Set()) {
  return text.split(/(<ruby\b[^>]*>[\s\S]*?<\/ruby>|<[^>]+>)/g).map(part => {
    if (part.startsWith('<ruby')) {
      seen.add(plain(part));
      return part;
    }
    if (part.startsWith('<')) return part;
    return part.replace(matcher, term => {
      if (seen.has(term)) return term;
      seen.add(term);
      return `<ruby>${term}<rt>${readings[term]}</rt></ruby>`;
    });
  }).join('');
}
function renderParagraphs(paragraphs) {
  const seen = new Set();
  return paragraphs.map(text => `<p>${annotate(text, seen)}</p>`).join('\n');
}
function wordNotes(story) {
  const body = plain(story.paragraphs.join(''));
  const terms = Object.keys(glossary).filter(term => body.includes(term));
  if (!terms.length) return '';
  return '<dt>ことばの補足</dt><dd>' + terms.map(term => `${annotate(term)} — ${glossary[term]}`).join('<br>') + '</dd>';
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || Number.isNaN(Date.parse(value+'T00:00:00Z'))) {
    throw new Error('Missing or invalid editorial date: '+value);
  }
  return value;
}
function japaneseDate(value) {
  return validDate(value).split('-').map(Number).map((n,i)=>n+['年','月','日'][i]).join('');
}
function syncRelated(stories, originalUpdatedAt) {
  const updatedAt = stories.map(s=>validDate(s.updatedAt)).sort().at(-1);
  const count = stories.length;
  const homePath = 'index.html';
  let home = fs.readFileSync(homePath,'utf8');
  const announcement = home.match(/<a\b[^>]*id="serialAnnouncement"[\s\S]*?<\/a>/)?.[0];
  if (!announcement) throw new Error('Missing homepage serial announcement');
  const next = announcement
    .replace(/aria-label="[^"]*"/, `aria-label="連載中、新・遠野物語 ― 紫波異聞。全${count}話を読む"`)
    .replace(/(<span class="serial-announcement-progress">)[\s\S]*?(<\/span>)/, `$1全${count}話を掲載 ／ 原作全文・やさしい再話つき$2`);
  home = home.replace(announcement, next);
  const homeSchema = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!homeSchema) throw new Error('Missing homepage schema');
  const schema = JSON.parse(homeSchema[1]);
  const homeDate = [validDate(schema.dateModified),updatedAt].sort().at(-1);
  if (schema.dateModified !== homeDate) {
    schema.dateModified = homeDate;
    home = home.replace(homeSchema[0], `<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
    home = home.replace(/最終更新日：\d{4}年\d{1,2}月\d{1,2}日（日本時間）/, `最終更新日：${japaneseDate(homeDate)}（日本時間）`);
  }
  fs.writeFileSync(homePath,home);

  const seriesFiles = [
    ['shin-tono.html',updatedAt],['shin-tono/sources.html',updatedAt],
    ['shin-tono/original.html',validDate(originalUpdatedAt)],
    ...stories.map(s=>[`shin-tono/${s.slug}.html`,s.updatedAt])
  ];
  const sitemapPath='sitemap.xml';
  let sitemap=fs.readFileSync(sitemapPath,'utf8');
  sitemap=sitemap.replace(/\s*<url>\s*<loc>https:\/\/djnaoyaman\.github\.io\/youkai\/shin-tono(?:\.html|\/[^<]+)<\/loc>[\s\S]*?<\/url>/g,'');
  sitemap=sitemap.replace('</urlset>',seriesFiles.map(([file,date])=>`  <url><loc>https://djnaoyaman.github.io/youkai/${file}</loc><lastmod>${date}</lastmod></url>`).join('\n')+'\n</urlset>');
  sitemap=sitemap.replace(/(<loc>https:\/\/djnaoyaman\.github\.io\/youkai\/<\/loc><lastmod>)[^<]+/, '$1'+homeDate);
  fs.writeFileSync(sitemapPath,sitemap);

  const llmsPath='llms.txt';
  let llms=fs.readFileSync(llmsPath,'utf8');
  const begin='<!-- shin-tono:start -->',end='<!-- shin-tono:end -->';
  const block=begin+'\n## 新・遠野物語 ― 紫波異聞\n'
    +`紫波町の伝承を土台にした現代の創作、全${count}話。物語はフィクションであり、実在の伝承の記録と混同しないでください。\n`
    +'- 連載一覧: https://djnaoyaman.github.io/youkai/shin-tono.html\n'
    +stories.map((s,i)=>`- 第${i+1}話「${s.title}」: https://djnaoyaman.github.io/youkai/shin-tono/${s.slug}.html`).join('\n')+'\n'
    +'- 出典と創作の区分: https://djnaoyaman.github.io/youkai/shin-tono/sources.html\n'
    +'- 遠野物語の原作全文: https://djnaoyaman.github.io/youkai/shin-tono/original.html\n'+end;
  if (llms.includes(begin)) llms=llms.replace(new RegExp(escapeRegex(begin)+'[\\s\\S]*?'+escapeRegex(end)),block);
  else llms=llms.replace('## 引用・参照について',block+'\n\n## 引用・参照について');
  fs.writeFileSync(llmsPath,llms);
}
module.exports={readings,glossary,plain,annotate,renderParagraphs,wordNotes,validDate,japaneseDate,syncRelated};
