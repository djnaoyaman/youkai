from pathlib import Path
from html.parser import HTMLParser
import re
class Page(HTMLParser):
 def __init__(self): super().__init__();self.ids=[];self.images=[];self.details=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='img' and 'logo' in a.get('class',''):self.images.append(a)
  if tag=='details':self.details+=1
files=list(Path('.').rglob('*.html'));assert len(files)==419
for f in files:
 s=f.read_text();p=Page();p.feed(s)
 assert len(p.ids)==len(set(p.ids)),f
 assert p.details>=1,f
 assert 'id="navFallback"' in s and 'brand-ui.js' in s,f
 assert len(p.images)>=2,f
 for img in p.images:
  assert img['alt']=='一見坊の【日本妖怪学体系】',f
  assert (f.parent/img['src']).exists(),(f,img['src'])
 assert '妖怪字' not in s,f
 for attr in ['canonical','og:title','twitter:title']:assert attr in s,(f,attr)
print('419 pages: logo alt/local assets, menu fallback, unique IDs, metadata verified')
