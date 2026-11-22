"""Build category indexes from the existing catalogue; run after adding a yokai."""
from pathlib import Path
from html import escape, unescape
from html.parser import HTMLParser
from urllib.parse import quote
import re, json
ROOT = Path(__file__).resolve().parent
BASE = 'https://djnaoyaman.github.io/youkai/'
SAUNA_ARTWORK = {
 'mizu-moguri', 'isu-gui', 'neppa-jizou', 'loyly-mugenbou', 'asefurashi',
 'kerorinpa', 'ashi-nure', 'samesi-rounin', 'tamuroh', 'bichonse'
}
CATEGORIES = [
 ('__DAI__','daiyokai','大妖怪のみ'),('産業革命','sangyo','産業革命'),
 ('モータリゼーション','motorization','モータリゼーション'),('IT革命','it','IT革命'),
 ('職場にいる妖怪','shokuba','職場にいる妖怪'),
 ('人と人の関係を邪魔する妖怪','ningen','人と人の関係を邪魔する妖怪'),
 ('みんなの場所にいる妖怪','kokyo','みんなの場所にいる妖怪'),('終末妖怪','shumatsu','終末妖怪'),
 ('温浴施設とサウナにいる妖怪','sauna','温浴施設とサウナにいる妖怪'),('AI革命','ai','AI革命'),
 ('戦争','senso','戦争'),('いてほしい妖怪','itehoshii','いてほしい妖怪'),
 ('家と暮らしにいる妖怪','kurashi','家と暮らしにいる妖怪'),('学校と学びにいる妖怪','gakko','学校と学びにいる妖怪'),
 ('お金と商いにいる妖怪','okane','お金と商いにいる妖怪'),('体と心にいる妖怪','karada','体と心にいる妖怪'),
 ('旅と道にいる妖怪','tabi','旅と道にいる妖怪')]
class Attrs(HTMLParser):
 def handle_starttag(self,tag,attrs):
  if not hasattr(self,'attrs'): self.attrs=dict(attrs)
def attrs(s):
 p=Attrs();p.feed(s);return p.attrs

def filename(slug): return 'gendai-category-'+slug+'.html'
def artwork_card(card):
 slug=Path(attrs(card)['href']).stem
 if slug not in SAUNA_ARTWORK: return card
 preview='<span class="gendai-card-art"><img src="parallax-'+slug+'.jpg" alt="" width="1920" height="1080" loading="lazy" decoding="async"></span>'
 return re.sub(r'(<a\b[^>]*>)',lambda m:m[1]+preview,card,count=1)

def build():
 index=ROOT/'gendai-yokai.html'
 source=index.read_text()
 cards=[(s,attrs(s)) for s in re.findall(r'<a class="gendai-card\b.*?</a>',source,re.S)]
 assert len(cards)==len({a['href'] for s,a in cards})
 counts={key:sum(a['data-dai']=='1' if key=='__DAI__' else a['data-era']==key for s,a in cards) for key,_,_ in CATEGORIES}
 assert {a['data-era'] for s,a in cards}=={k for k,_,_ in CATEGORIES if k!='__DAI__'}
 def nav(current=None):
  links=['<a href="gendai-yokai.html"'+(' aria-current="page"' if current is None else '')+'>すべてのカテゴリ<span>'+str(len(cards))+'体</span></a>']
  for key,slug,label in CATEGORIES:
   links.append('<a href="'+filename(slug)+'"'+(' aria-current="page"' if key==current else '')+'>'+label+'<span>'+str(counts[key])+'体</span></a>')
  markup = '<!-- GENDAI CATEGORY NAV START -->\n<section class="gendai-category-nav" aria-label="カテゴリ別の索引"><h2>カテゴリから探す</h2><div class="gendai-category-links">'+''.join(links)+'</div></section>\n<!-- GENDAI CATEGORY NAV END -->'
  return markup if current is None else markup.replace('<section class="gendai-category-nav" aria-label="カテゴリ別の索引"><h2>カテゴリから探す</h2>', '<details class="gendai-category-nav"><summary>ほかのカテゴリから探す</summary>').replace('</section>', '</details>')
 source=re.sub(r'<!-- GENDAI CATEGORY NAV START -->.*?<!-- GENDAI CATEGORY NAV END -->\s*','',source,flags=re.S)
 source=source.replace('<div class="stance-box">',nav()+'\n\n<div class="stance-box">',1)
 if 'gendai-categories.css' not in source:
  source=source.replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css">\n<link rel="stylesheet" href="gendai-categories.css">')
 # Keep all existing cards, dates and order intact.
 index.write_text(source)
 prefix=source[:source.index('<div class="stance-box">')]
 suffix=source[source.index('<footer class="sitefoot">'):]
 search=re.search(r'<div class="gendai-search-wrap">.*?(?=<section id="gendaiResults")',source,re.S).group()
 pagination=re.search(r'<nav class="gendai-pagination".*?</style>',source,re.S)
 if not pagination:
  pagination=re.search(r'<div class="gendai-pagination".*?</style>',source,re.S)
 assert pagination
 for key,slug,label in CATEGORIES:
  path=filename(slug);url=BASE+path;title=label+' ｜ 近現代妖怪 ｜ 一見坊の【日本妖怪学体系】'
  subset=[s for s,a in cards if (a['data-dai']=='1' if key=='__DAI__' else a['data-era']==key)]
  if slug=='sauna': subset=[artwork_card(s) for s in subset]
  desc=f'近現代妖怪の「{label}」{len(subset)}体を、追加が新しい順に紹介するカテゴリ別索引。一見坊による完全な創作です。妖怪と人間は別の存在として描いています。'
  head=re.sub(r'<!-- GENDAI CATEGORY NAV START -->.*?<!-- GENDAI CATEGORY NAV END -->',nav(key),prefix,flags=re.S)
  head=head.replace('<h1>近現代妖怪</h1>','<h1>'+label+'</h1>')
  head=head.replace(' ／ 近現代妖怪</div>',' ／ <a href="gendai-yokai.html">近現代妖怪</a> ／ '+label+'</div>')
  head=re.sub(r'<title>.*?</title>','<title>'+title+'</title>',head)
  head=re.sub(r'(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*',lambda m:m[1]+escape(desc,quote=True),head)
  head=re.sub(r'(<meta (?:name|property)="(?:og:title|twitter:title)" content=")[^"]*',lambda m:m[1]+title,head)
  head=head.replace(BASE+'gendai-yokai.html',url)
  head=re.sub(r'<script type="application/ld\+json">.*?</script>','',head,flags=re.S)
  breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':i+1,'name':name,'item':u} for i,(name,u) in enumerate([('日本妖怪学体系',BASE),('近現代妖怪',BASE+'gendai-yokai.html'),(label,url)])]}
  collection={'@context':'https://schema.org','@type':'CollectionPage','name':label,'url':url,'description':desc,'mainEntity':{'@type':'ItemList','numberOfItems':len(subset),'itemListElement':[{'@type':'ListItem','position':i+1,'url':BASE+attrs(s)['href'],'name':attrs(s)['data-name']} for i,s in enumerate(subset)]}}
  head=head.replace('</head>',''.join('<script type="application/ld+json">'+json.dumps(o,ensure_ascii=False)+'</script>\n' for o in [breadcrumb,collection])+'</head>')
  local_search=re.sub(r'<div class="gendai-search-filters">.*?</div>','<select id="gendaiFilterEra" hidden aria-label="現在のカテゴリ"><option value="">'+label+'</option></select>',search,flags=re.S)
  local_search=local_search.replace('妖怪名・かな・性質で検索（例：忘れ、電池、いてほしい）','このカテゴリの妖怪を検索')
  tail=suffix.replace(BASE+'gendai-yokai.html',url).replace(quote(BASE+'gendai-yokai.html',safe=''),quote(url,safe='')).replace(quote('近現代妖怪（完全創作）',safe=''),quote(label+'（近現代妖怪）',safe=''))
  tail=tail.replace('entry/s/djnaoyaman.github.io/youkai/gendai-yokai.html','entry/s/djnaoyaman.github.io/youkai/'+path)
  body='<div class="stance-box"><p>'+desc+'</p><p><a href="gendai-yokai.html">← 近現代妖怪の総合索引へ</a></p></div>\n'+local_search+'<section id="gendaiResults" aria-label="'+label+'の一覧"><h2>'+label+'の一覧</h2><p>追加が新しい順に掲載しています。</p><div class="gendai-card-grid" id="gendaiCardGrid">\n'+'\n'.join(subset)+'\n</div></section>\n'+pagination.group()+'\n'
  if slug=='sauna': body=body.replace('class="gendai-card-grid"','class="gendai-card-grid gendai-art-grid"')
  (ROOT/path).write_text(head+body+tail)
 for _,a in cards:
  p=ROOT/a['href'];s=p.read_text();key=a['data-era'];slug=next(sl for k,sl,_ in CATEGORIES if k==key)
  s=s.replace(' ／ '+key+'</div>',' ／ <a href="../'+filename(slug)+'">'+key+'</a></div>',1)
  s=re.sub(r'<!-- GENDAI CATEGORY RETURN -->.*?<!-- /GENDAI CATEGORY RETURN -->\s*','',s,flags=re.S)
  marker='<p style="margin-top:20px;" class="reveal-text"><a href="../gendai-yokai.html">'
  back='<!-- GENDAI CATEGORY RETURN --><p class="gendai-category-return"><a href="../'+filename(slug)+'">← '+key+'の一覧へ</a>'
  if a['data-dai']=='1': back+=' ／ <a href="../gendai-category-daiyokai.html">大妖怪の一覧へ</a>'
  back+='</p><!-- /GENDAI CATEGORY RETURN -->\n'
  assert marker in s,p
  s=s.replace(marker,back+marker,1);p.write_text(s)
 sitemap=ROOT/'sitemap.xml';s=sitemap.read_bytes().decode()
 s=re.sub(r'  <url><loc>'+re.escape(BASE)+r'gendai-category-[^\r\n]*</url>\r?\n','',s)
 anchor='  <url><loc>'+BASE+'shin-tono.html'
 if anchor not in s: anchor='</urlset>'
 s=s.replace(anchor,''.join('  <url><loc>'+BASE+filename(slug)+'</loc><lastmod>'+('2026-11-23' if slug=='sauna' else '2026-11-16')+'</lastmod><priority>0.6</priority></url>\n' for _,slug,_ in CATEGORIES)+anchor,1)
 sitemap.write_bytes(s.encode())
 llms=ROOT/'llms.txt';s=llms.read_text();s=re.sub(r'\n<!-- GENDAI CATEGORIES -->.*?<!-- /GENDAI CATEGORIES -->\n','\n',s,flags=re.S)
 s=s.rstrip()+'\n\n<!-- GENDAI CATEGORIES -->\n## 近現代妖怪のカテゴリ別索引\n既存の16カテゴリと大妖怪の一覧。各索引は完全な創作であり、実在の伝承ではありません。\n'+''.join('- '+label+f'（{counts[key]}体） '+BASE+filename(slug)+'\n' for key,slug,label in CATEGORIES)+'<!-- /GENDAI CATEGORIES -->\n';llms.write_text(s)
 print(f'Built {len(CATEGORIES)} category indexes from {len(cards)} yokai.')
if __name__=='__main__': build()
