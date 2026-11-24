# Content updates in this repository

These are persistent project instructions requested by the user. A content edit is complete only after its dependent files are updated, checked, and—when requested—deployed and verified. Do not treat a generated HTML edit alone as the finished work.

## 江戸怪談百物語 — 文芸校正と掲載の約束

- 正本は `hyakumonogatari.html` の第1〜99夜一覧と `kaidan/*.html` の99話。作品名、既存スラッグ、並び順、各話の前後リンクを変えるときは必ず全体を照合する。
- 99話までで最後の灯芯を残し、百話目は語らない。各話に百話目を語った逸話が出てくる場合は、別の座敷の言い伝えなどとして区別し、この連作自体が完結したように見せない。
- 文章は自然な日本語で、読む速度を妨げる読点の多用、単語を機械的に区切る短文、説明調の結末、繰り返される「〜と思うようになった」「〜かもしれない」に頼らない。場面・音・匂い・人物の所作によって読者に想像の余白を残す。
- 一方で、手控え・図録・証言・書簡・往来手形・日記といった各話固有の形式や意図的な反復は一律に均さない。声の違いを守り、怪異を合理的に説明しきらない。
- 新たな描写を加える際は年齢、親族関係、婚姻、経過年数、人物の移動、灯芯の本数、持ち物の所在、江戸期の地理・生活道具と矛盾しないか確認する。実在地名や当時の制度については調査し、確定できないものは無理に断定しない。
- 「編者の後書き」も作品の一部。「〇〇という構成にした」「〇〇の文体を試みた」といった一律の制作技法説明で埋めず、物語固有の手触りを短く記す。本文の解釈を一つに固定しない。
- 伝承ではなくオリジナル創作であること、杉浦日向子『百物語』に着想を得たこと、創作の注記は維持する。実在の怪異記録と誤認させない。
- 本文や後書きの変更後は `hyakumonogatari.html` の紹介、99件の一覧リンク、各話の前後導線、ルビの `<ruby>/<rt>`、HTML段落の整合とページメタ情報を必ず確認し、公開時はデプロイ成功と代表的な公開ページを検証する。

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

## 近現代妖怪

- 妖怪と人間は別の存在。人そのものを妖怪の名前で呼ばず、妖怪が取り憑くことでその人の言動や判断が変わる、という文脈で書く。途中で妖怪と憑かれた人の主語を混同しない。
- 場所に棲むことと、そこに来た人へ一時的に取り憑くことは両立する。物や場所に作用する妖怪も、人そのものとは区別する。
- 個別ページの本文を変えたら、一覧の検索用 `data-body`、大妖怪紹介、メタ情報、構造化データ、サイトマップ、`llms.txt` の関連説明も整合させる。追加日時と既存の掲載順は保つ。

### カテゴリ別索引

- 既存のカテゴリ名と所属は `gendai-yokai.html` の選択肢・カードを基準にする。`build-gendai-categories.py` は、この一覧から16カテゴリと「大妖怪のみ」の17索引を生成する。
- 妖怪の追加・分類変更・カード内容更新後は `python3 build-gendai-categories.py` を実行し、生成された `gendai-category-*.html`、各妖怪のカテゴリ導線、`sitemap.xml`、`llms.txt` をまとめて更新する。追加日時と掲載順を保つ。
- `python3 tests/gendai-categories.py`、`python3 tests/launch-metadata.py`、`python3 tests/brand-static.py` を実行する。索引のレイアウトは `gendai-categories.css` で調整し、既存のサイトデザインを引き継ぐ。
