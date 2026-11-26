"""Check discovery, share cards, and tracking tags for every published HTML route."""
import json
import re
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://djnaoyaman.github.io/youkai/"
MAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
SOURCE_DIRS = {"tests", "docs", "source-materials"}
REQUIRED = (
    "description", "robots", "og:title", "og:description", "og:url",
    "og:image", "og:site_name", "twitter:card", "twitter:title",
    "twitter:description", "twitter:image",
)
GA = "G-9ZDWL2GBLG"


class Head(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fields = defaultdict(list)
        self.active = None
        self.in_head = False

    def handle_starttag(self, tag, pairs):
        a = dict(pairs)
        if tag == "head":
            self.in_head = True
        if not self.in_head:
            return
        if tag == "title":
            self.active = "title"
        if tag == "script" and a.get("type") == "application/ld+json":
            self.active = "json"
        if self.active and tag in {"title", "script"}:
            self.fields[self.active].append("")
        if tag == "meta":
            self.fields[a.get("property", a.get("name"))].append(a.get("content", ""))
        if tag == "link" and a.get("rel", "").lower() == "canonical":
            self.fields["canonical"].append(a.get("href"))

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        if tag in {"title", "script"}:
            self.active = None

    def handle_data(self, data):
        if self.active:
            self.fields[self.active][-1] += data


entries = ET.parse(ROOT / "sitemap.xml").findall(f"{MAP_NS}url/{MAP_NS}loc")
actual = Counter(e.text for e in entries)
expected = Counter()
seen = {"title": set(), "description": set()}
checked = 0
for path in sorted(ROOT.rglob("*.html")):
    route = path.relative_to(ROOT)
    if any(part.startswith(".") for part in route.parts) or route.parts[0] in SOURCE_DIRS:
        continue
    if route.as_posix() == "404.html":
        # GitHub Pages' missing-route fallback must stay out of search.
        h = Head()
        h.feed(path.read_text("utf-8"))
        assert "noindex" in " ".join(h.fields["robots"]), route
        continue
    source = path.read_text("utf-8")
    checked += 1
    h = Head()
    h.feed(source)
    fields = h.fields
    url = BASE + ("" if route.as_posix() == "index.html" else route.as_posix())
    expected[url] += 1
    for k in ("title", *REQUIRED):
        values = fields[k]
        assert len(values) == 1 and values[0].strip(), (route, k, values)
    for k, v in seen.items():
        value = fields[k][0].strip()
        assert value not in v, (route, "duplicate", k, value)
        v.add(value)
    assert "noindex" not in fields["robots"][0], (route, fields["robots"])
    assert fields["canonical"] == fields["og:url"] == [url], (route, fields["canonical"], fields["og:url"])
    assert fields["og:image"] == fields["twitter:image"], (route, "card images differ")
    card = fields["og:image"][0]
    assert card.startswith(BASE) and (ROOT / unquote(urlparse(card).path.removeprefix("/youkai/"))).is_file(), (route, card)
    assert fields["json"] and all(json.loads(item) for item in fields["json"]), route
    assert re.findall(r"https://www.googletagmanager.com/gtag/js\?id=(G-[A-Z0-9]+)", source) == [GA], (route, "GA loader")
    assert re.findall(r"""gtag\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]+)""", source) == [GA], (route, "GA config")
assert checked and actual == expected, ("missing", list(expected - actual), "unexpected or duplicate", list(actual - expected))
print(f"SEO regression: {checked} indexable routes, exact sitemap, valid metadata/share images/JSON-LD/GA tags, 404 noindex")
