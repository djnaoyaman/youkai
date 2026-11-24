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


FIGURE = re.compile(r'<figure class="(kaidan-illustration|kaidan-scene)">\s*(.*?)\s*</figure>', re.S)
PARAGRAPH = re.compile(r'<p(?: [^>]*)?>.*?</p>', re.S)
BODY_OPEN = '<div class="record-body">'
# Reviewed manuscript codas, not a fallback for a misplaced figure.
HORIZONTAL_CODAS = {'miyazakinohi.html', 'tanmononoyukue.html', 'toushinnotsuzuki.html', 'wasuremono.html'}


def adjacent_paragraph_indices(body, figure, paragraphs, *, terminal=False):
    """A figure is valid only in whitespace between two complete consecutive paragraphs."""
    for i, (left, right) in enumerate(zip(paragraphs, paragraphs[1:]), 1):
        if left.end() <= figure.start() < figure.end() <= right.start():
            if not (body[left.end():figure.start()] + body[figure.end():right.start()]).strip():
                return i
    if terminal and not (body[paragraphs[-1].end():figure.start()] + body[figure.end():]).strip() and paragraphs[-1].end() <= figure.start():
        return len(paragraphs)
    raise AssertionError('Illustration is not at a permitted complete paragraph boundary')


def main():
    index = (ROOT / 'hyakumonogatari.html').read_text()
    stories = re.findall(r'href="kaidan/([a-z]+\.html)"><span class="entry-name">第(\d+)夜', index)
    assert [int(number) for _, number in stories] == list(range(1, 100)), stories
    assert len({slug for slug, _ in stories}) == 99
    assert set(x for x, _ in stories) == {p.name for p in (ROOT / 'kaidan').glob('*.html')}
    formats = {
        'kaidan-illustration': ('kaidan', '', 4, 3, range(1300, 1551)),
        'kaidan-scene': ('kaidan-scenes', '-scene', 9, 16, range(720, 1201)),
    }
    referenced = {name: set() for name in formats}
    for slug, number in stories:
        html = (ROOT / 'kaidan' / slug).read_text()
        assert html.count('<div class="record-head">') == html.count(BODY_OPEN) == 1, slug
        head = html.split('<div class="record-head">', 1)[1].split(BODY_OPEN, 1)[0]
        body, afterbody = html.split(BODY_OPEN, 1)[1].split('\n  </div>', 1)
        paragraphs = list(PARAGRAPH.finditer(body))
        assert paragraphs, slug
        counts = {name: 0 for name in formats}
        used_boundaries = set()
        for section, text in (('opening', head), ('body', body)):
            for figure in FIGURE.finditer(text):
                kind, img = figure.groups()
                counts[kind] += 1
                assert counts[kind] == 1, (slug, kind)
                if section == 'opening':
                    assert kind == 'kaidan-illustration', (slug, kind)
                    assert text[:figure.start()].rstrip().endswith('</div>')
                    assert not text[figure.end():].strip(), slug
                else:
                    afterword = afterbody.lstrip().startswith('<div class="omake">')
                    terminal = afterword and ((kind == 'kaidan-illustration' and slug in HORIZONTAL_CODAS) or (kind == 'kaidan-scene' and slug in {'egusashi.html', 'henshin.html', 'hotarunoshuku.html', 'kagamishinoigon.html', 'kageboushinoshakkin.html', 'kamadononakanokoe.html', 'karasunoigon.html', 'katatsumurinoshisha.html', 'kietahanayome.html', 'kikunoyakusoku.html', 'kitsunenoyomeiri.html', 'kodamanoshukudai.html', 'kubinashijizou.html', 'kujinomura.html', 'kuranonakanokoe.html', 'momoyogayoi.html', 'morinonakanoutagai.html', 'mushinooto.html', 'noumennoonna.html', 'obochigainokateikyoushi.html', 'okenonakanokao.html', 'rashoumonnoato.html', 'ryousainokyaku.html', 'sanninshimai.html', 'seminoyadogae.html', 'senryoubako.html', 'shinkiroonomise.html', 'tsujigirinoie.html', 'yanaginoshitanootoko.html', 'yomenaifumi.html', 'yoseatsumenoningyou.html'}))
                    boundary = adjacent_paragraph_indices(body, figure, paragraphs, terminal=terminal)
                    assert boundary not in used_boundaries, (slug, boundary)
                    used_boundaries.add(boundary)
                    if slug == 'fumitsukai.html' and kind == 'kaidan-scene':
                        assert boundary == 3, 'The handover scene belongs after paragraph three'
                picture = Picture(img).elements
                assert len(picture) == 1 and picture[0][0] == 'img', slug
                attrs = picture[0][1]
                directory, suffix, ax, ay, widths = formats[kind]
                expected = f'{int(number):03d}-{Path(slug).stem}{suffix}.webp'
                assert expected not in referenced[kind] and attrs.get('src') == f'../assets/{directory}/{expected}', slug
                assert attrs.get('loading') == 'lazy' and attrs.get('decoding') == 'async', slug
                assert len(attrs.get('alt', '').strip()) >= 8, slug
                width, height = webp_size(ROOT / 'assets' / directory / expected)
                assert width == int(attrs['width']) and height == int(attrs['height']), slug
                assert abs(width / height - ax / ay) < 0.002 and width in widths, slug
                referenced[kind].add(expected)
        for kind, count in counts.items():
            assert count == html.count(f'class="{kind}"') <= 1, (slug, kind)
        if counts['kaidan-scene']:
            assert counts['kaidan-illustration'], slug
    for kind, (directory, *_rest) in formats.items():
        assets = ROOT / 'assets' / directory
        actual_assets = {p.name for p in assets.iterdir() if p.is_file()} if assets.exists() else set()
        assert referenced[kind] == actual_assets, (kind, referenced[kind] - actual_assets, actual_assets - referenced[kind])
    if '--complete' in sys.argv:
        assert len(referenced['kaidan-illustration']) == 99, 'Full deployment requires 99 horizontal illustrations'
    print(f"百物語: 99 stories, {len(referenced['kaidan-illustration'])} horizontal illustrations "
          f"and {len(referenced['kaidan-scene'])} inline scenes; placement and assets match.")


if __name__ == '__main__':
    main()
