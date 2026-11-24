"""Check one unique, balanced illustration per published 百物語 story."""
import re
import struct
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Picture(HTMLParser):
    def __init__(self, fragment):
        self.elements = []
        super().__init__()
        self.feed(fragment)

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))


def webp_size(path):
    data = path.read_bytes()
    assert data[:4] == b'RIFF' and data[8:12] == b'WEBP', path
    assert int.from_bytes(data[4:8], 'little') + 8 == len(data), path
    chunk = data[12:16]
    if chunk == b'VP8X':
        return tuple(int.from_bytes(data[i:i + 3], 'little') + 1 for i in (24, 27))
    if chunk == b'VP8 ':
        assert data[23:26] == b'\x9d\x01\x2a', path
        return tuple(x & 0x3fff for x in struct.unpack_from('<HH', data, 26))
    if chunk == b'VP8L':
        assert data[20] == 0x2f, path
        bits = int.from_bytes(data[21:25], 'little')
        return (bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1
    raise AssertionError(f'{path}: WebP dimensions cannot be parsed')


def main():
    index = (ROOT / 'hyakumonogatari.html').read_text()
    stories = re.findall(r'href="kaidan/([a-z]+\.html)"><span class="entry-name">第(\d+)夜', index)
    assert [int(number) for _, number in stories] == list(range(1, 100)), stories
    assert len({slug for slug, _ in stories}) == 99
    assert set(x for x, _ in stories) == {p.name for p in (ROOT / 'kaidan').glob('*.html')}
    assets = ROOT / 'assets/kaidan'
    actual_assets = {p.name for p in assets.iterdir() if p.is_file()} if assets.exists() else set()
    referenced = set()
    for slug, number in stories:
        html = (ROOT / 'kaidan' / slug).read_text()
        assert html.count('<div class="record-head">') == html.count('<div class="record-body">') == 1, slug
        between = html.split('<div class="record-head">', 1)[1].split('<div class="record-body">', 1)[0]
        figures = re.findall(r'<figure class="kaidan-illustration">\s*(.*?)\s*</figure>', between, re.S)
        assert len(figures) == html.count('class="kaidan-illustration"') <= 1, slug
        if not figures:
            continue
        picture = Picture(figures[0]).elements
        assert len(picture) == 1 and picture[0][0] == 'img', slug
        attrs = picture[0][1]
        expected = f'{int(number):03d}-{Path(slug).stem}.webp'
        assert expected not in referenced and attrs.get('src') == f'../assets/kaidan/{expected}', slug
        assert attrs.get('loading') == 'lazy' and attrs.get('decoding') == 'async', slug
        assert len(attrs.get('alt', '').strip()) >= 8, slug
        width, height = webp_size(assets / expected)
        assert width == int(attrs['width']) and height == int(attrs['height']), slug
        assert abs(width / height - 4/3) < 0.002 and 1300 <= width <= 1550, slug
        referenced.add(expected)
    assert referenced == actual_assets, (referenced - actual_assets, actual_assets - referenced)
    if '--complete' in sys.argv:
        assert len(referenced) == 99, 'Full deployment requires 99 illustrations'
    print(f'百物語: 99 stories, {len(referenced)} illustrations, assets and placement match.')


if __name__ == '__main__':
    main()
