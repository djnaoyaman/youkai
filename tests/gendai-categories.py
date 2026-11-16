"""Category membership, ordering, metadata, return links and rebuild consistency."""
from pathlib import Path
import hashlib, json, re, runpy, subprocess
ROOT=Path(__file__).resolve().parents[1]
build=runpy.run_path(str(ROOT/'build-gendai-categories.py'))
attrs=build['attrs']; categories=build['CATEGORIES']; filename=build['filename']; base=build['BASE']
index=(ROOT/'gendai-yokai.html').read_text()
cards=[attrs(s) for s in re.findall(r'<a class="gendai-card\b.*?</a>',index,re.S)]
for key,slug,label in categories:
 page=(ROOT/filename(slug)).read_text()
 actual=[attrs(s)['href'] for s in re.findall(r'<a class="gendai-card\b.*?</a>',page,re.S)]
 expected=[a['href'] for a in cards if (a['data-dai']=='1' if key=='__DAI__' else a['data-era']==key)]
 assert actual==expected,(label,actual,expected)
 assert f'<h1>{label}</h1>' in page
 assert f'<link rel="canonical" href="{base}{filename(slug)}">' in page
 assert '完全な創作' in page
 assert 'ほかのカテゴリから探す' in page
 for schema in re.findall(r'<script type="application/ld\+json">(.*?)</script>',page,re.S):
  data=json.loads(schema)
  if data['@type']=='CollectionPage': assert data['mainEntity']['numberOfItems']==len(expected)
 for href in re.findall(r'(?:href|src)="([^"]+)"',page):
  if re.match(r'^(?:https?:|data:|#)',href):continue
  assert (ROOT/href.split('#')[0].split('?')[0]).exists(),(label,href)
 assert base+filename(slug) in (ROOT/'sitemap.xml').read_text()
for card in cards:
 page=(ROOT/card['href']).read_text()
 slug=next(slug for key,slug,label in categories if key==card['data-era'])
 assert '../'+filename(slug) in page
 if card['data-dai']=='1':assert '../gendai-category-daiyokai.html' in page
paths=[ROOT/'gendai-yokai.html',ROOT/'llms.txt',ROOT/'sitemap.xml',*ROOT.glob('gendai-category-*.html'),* (ROOT/'gendai').glob('*.html')]
before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
subprocess.run(['python3',str(ROOT/'build-gendai-categories.py')],check=True)
assert all(hashlib.sha256(p.read_bytes()).hexdigest()==digest for p,digest in before.items()),'Rebuild is not reproducible'
print(f'PASS: {len(categories)} indexes, {len(cards)} unchanged cards, membership/order, metadata, local links, return links and reproducible build')
