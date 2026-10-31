"""Regression checks for the existing homepage sharing card."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
import json
ROOT = Path(__file__).resolve().parents[1]
class Head(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.meta, self.canonical, self.schemas = {}, [], []
        self.schema = None
        self.feed(path.read_text())
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta':
            key = a.get('property', a.get('name'))
            if key:
                self.meta.setdefault(key, []).append(a.get('content', ''))
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical.append(a['href'])
        if tag == 'script' and a.get('type') == 'application/ld+json':
            self.schema = ''
    def handle_data(self, data):
        if self.schema is not None:
            self.schema += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.schema is not None:
            self.schemas.append(json.loads(self.schema))
            self.schema = None
home = Head(ROOT / 'index.html')
assert home.canonical == ['https://djnaoyaman.github.io/youkai/']
assert home.schemas
assert home.meta['og:image:type'] == ['image/jpeg']
assert home.meta['og:image:alt'] == home.meta['twitter:image:alt']
assert home.meta['og:image:alt'][0].strip()
assert home.meta['og:image'] == home.meta['twitter:image']
assert home.meta['og:image:width'] == ['1200']
assert home.meta['og:image:height'] == ['630']
image_path = urlparse(home.meta['og:image'][0]).path.removeprefix('/youkai/')
image = (ROOT / image_path).read_bytes()
assert image.startswith(bytes([255,216,255]))
assert home.meta['og:site_name'] == ['一見坊の【日本妖怪学体系】']
assert (ROOT / 'llms.txt').read_text().startswith('# 一見坊の【日本妖怪学体系】')
print('PASS: existing sharing card type/alt, canonical, JSON-LD and brand name')
