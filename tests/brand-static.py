from pathlib import Path
from html.parser import HTMLParser
import re, subprocess
class Page(HTMLParser):
 def __init__(self): super().__init__();self.ids=[];self.images=[];self.details=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='img' and 'logo' in a.get('class',''):self.images.append(a)
  if tag=='details':self.details+=1
def verify_logos(f, images):
 n={'brand-logo':0,'footer-logo':0,'ktk-official-logo':0}
 for img in images:
  tags=set(img['class'].split()) & n.keys()
  assert len(tags)==1,(f,img)
  role=tags.pop(); n[role]+=1
  dark_serial=f.parent==Path('.') and bool(re.fullmatch(r'kamakura-taxi-kaidan(?:-[0-9]{2})?\.html',f.name))
  common_asset='assets/youkai-logo-09-reverse.svg' if dark_serial else 'assets/youkai-logo-09.svg'
  alt,asset=('鎌倉タクシー怪談','assets/kaidan-logo-I.jpg') if role=='ktk-official-logo' else ('一見坊の【日本妖怪学体系】',common_asset)
  path=(f.parent/img['src']).resolve()
  assert img['alt']==alt and path==Path(asset).resolve() and path.is_file(),(f,img)
 assert n['brand-logo']==n['footer-logo']==1,(f,n)
 taxi=f.parent==Path('.') and (f.name=='kamakura.html' or re.fullmatch(r'kamakura-taxi-kaidan(?:-[0-9]{2})?\.html',f.name))
 assert n['ktk-official-logo']==int(bool(taxi)),(f,n)
files=[Path(p) for p in subprocess.check_output(['git','ls-files','*.html'],text=True).splitlines()];assert len(files)>=419
for f in files:
 s=f.read_text();p=Page();p.feed(s)
 assert len(p.ids)==len(set(p.ids)),f
 assert p.details>=1,f
 assert 'id="navFallback"' in s and 'brand-ui.js' in s,f
 verify_logos(f,p.images)
 assert '妖怪字' not in s,f
 assert 'class="cover-logo"' not in s,f
 assert '<span class="brand-prefix">一見坊の</span><span class="brand-title">【日本妖怪学体系】</span>' in s,f
 for attr in ['canonical','og:title','twitter:title']:assert attr in s,(f,attr)
print(f'{len(files)} pages: logo alt/local assets, menu fallback, unique IDs, metadata verified')

# The immediate intro logo must stay identical to the shared brand asset.
import json
intro = re.search(r"var introLogo = (.+);", Path("brand-ui.js").read_text())
assert intro and json.loads(intro[1]) == Path("assets/youkai-logo-09.svg").read_text()

# The reverse mark changes only ink; the red ring and vector geometry are identical.
assert Path('assets/youkai-logo-09-reverse.svg').read_text() == Path('assets/youkai-logo-09.svg').read_text().replace('#111111','#FFFFFF')
assert 'body.ktk-dark .brand-logo,body.ktk-dark .footer-logo{background:transparent;border-radius:0}' in Path('taxi-kaidan.css').read_text()
