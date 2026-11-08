# Content updates in this repository

These are persistent project instructions requested by the user. A content edit is complete only after its dependent files are updated, checked, and—when requested—deployed and verified. Do not treat a generated HTML edit alone as the finished work.

## 新・遠野物語 ― 紫波異聞

- Edit `shin-tono-data.json` as the source of truth for the five stories. It holds titles, leads, paragraphs, source records, the boundary between tradition and fiction, and retellings. Keep the existing story slugs stable.
- When a plot, scene, character or ending changes, update `invented` and any affected source/relation description. Do not rewrite the historical source or call invented events reported facts.
- Set the affected story's `updatedAt` to the actual edit date in Japan (`YYYY-MM-DD`). Change `sourceCheckedAt` only after actually checking that source. A rebuild alone is not a new source check.
- Use `？` for direct questions in dialogue, messages and direct internal questions, including short questions such as `下って、誰の田？`, `鍵は？` and `何時にする？`. Do not add question marks inside indirect clauses or turn statements into questions without reading the context.
- Give difficult place/person names and specialist or unfamiliar terms a reading at first use in each reading section. Do not annotate every ordinary kanji or repeat the same reading throughout a story. Keep certain readings in `shin-tono-editorial.cjs`; do not guess unverified local-name readings.
- Readings alone do not explain tools and farming terms. Maintain the short `ことばの補足` definitions in `shin-tono-editorial.cjs` where needed.
- Run `node build-shin-tono.cjs`. It regenerates all five story pages, the collection index and source notes; it also synchronizes the homepage announcement and its accessible label, sitemap entries/dates and the series section in `llms.txt`.
- Review `index.html`, `shin-tono.html`, every affected `shin-tono/*.html`, `shin-tono/sources.html`, `sitemap.xml` and `llms.txt`. Check episode counts, title/lead previews, previous/next links, canonical/OG/JSON-LD fields, fictional/source boundaries and dates together. Do not leave stale “three stories” announcements after adding stories.
- Preserve `shin-tono/original.html`'s original prose, readings and editorial notes and the archive `source-materials/tono-aozora-utf8.txt`. The modern-story punctuation/reading policy does not authorize rewriting the original book.
- Run `node tests/shin-tono.cjs` and `python3 tests/launch-metadata.py`. Run the build twice to check reproducibility and inspect the diff for unintended changes. CI repeats the generated-file consistency checks.
- For an authorized publication, commit the source and dependent generated files together, publish through the existing GitHub Pages site, wait for a successful deployment, then verify the changed live pages and announcement against the finished files. Only then report publication complete.

## Dependency map

| Change | Files to review/update |
| --- | --- |
| Story text, punctuation, title or lead | Source JSON, story HTML, collection cards, metadata, source/invention notes when affected |
| New story, order or slug | Source JSON, story pages, previous/next links, collection index/count, homepage announcement/accessible label, sitemap, `llms.txt`, tests |
| Difficult word or reading policy | Editorial helper, source prose if necessary, regenerated pages, terminology notes, tests |
| Actual edit or source recheck date | Corresponding JSON date field, page JSON-LD/footer, sitemap; never manufacture source recheck dates |

These checks apply to future revisions as well as the present five stories. For other content, identify and update the equivalent indexes, previews, navigation, source notes and discovery metadata before publishing.
