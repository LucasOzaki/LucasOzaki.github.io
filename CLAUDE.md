# Lucas Ozaki Mizuguti — academic website (Quarto)

Personal academic site, published at https://LucasOzaki.github.io from the `gh-pages` branch
by `.github/workflows/publish.yml`. Built with Quarto; the site config is `_quarto.yml`.

## Layout

- `index.qmd` — home (Quarto `about` page, trestles template).
- `research/papers.yml` — **single source of truth for papers**. `research/papers.ejs.md`
  renders it, grouped by `status`. Never hand-edit the list on the Research page.
- `teaching/index.qmd` — list of courses. Each course with material has a folder
  `teaching/<course>-<year>/` with an `index.qmd` (auto table of sheets) and one `.qmd` per sheet.
- `notes/<slug>/index.qmd` — expository articles (theorem environments, citations, `references.bib`).
- `manim/<slug>/` — one folder per animation: the rendered `.mp4`, `thumbnail.png`, and
  `index.qmd` with the video and short annotated excerpts of the code. The full Manim sources
  live in `~/Documents/manimations` and are **not** published (no `.py` files in `manim/`).
- `www/styles.scss` — theme. `www/images/` — profile picture, favicon.

## Conventions

- Math: `$...$` and `$$...$$`. Per-page LaTeX macros: plain `\newcommand` lines right after the
  front matter (pandoc expands them for HTML and passes them through to LaTeX for PDF).
- Theorem-like environments: Quarto cross-ref divs (`#thm-`, `#lem-`, `#def-`, `#exr-`) and
  `.proof` / `.solution` / `.remark`. Solutions are wrapped in a collapsed `callout-tip`.
- Solution sheets in Portuguese set `lang: pt`; they also render to PDF (`format-links: [pdf]`).
- When converting LaTeX to Quarto: keep the mathematics exactly as written; translate
  `\begin{theorem}` etc. into the divs above; put `\newcommand`s right after the front matter.
- Never invent bibliographic data (journals, volumes, DOIs, years). Leave a field out and
  flag it instead.
- Python chunks are frozen (`execute: freeze: auto`): after changing one, run `quarto render`
  locally and commit `_freeze/`.
- TikZ figures: the source is `notes/<slug>/figures/<name>.tex` and the page includes the
  generated `<name>.svg`. After editing a `.tex`, run `sh notes/<slug>/figures/build.sh`
  (uses `latex` and `dvisvgm` from MacTeX) and commit both files.
- Manim: render in `~/Documents/manimations` with `uv run manim -qh <file>.py <Scene>`; copy only
  the mp4 (and a thumbnail) next to `index.qmd`. Keep videos small (720p–1080p, under ~20 MB); larger ones go to YouTube and are
  embedded with `{{< video https://youtu.be/... >}}`.

## Interactive notes (model: `notes/basic-geometry/`)

- Figures are JSXGraph (plane) and three.js (space), loaded from jsdelivr at the end of the page.
  `geometry-plane.js` defines `window.GeoPlane` (the `Ctx` helpers and the `FIG` registry) and the
  figures of the theory; `geometry-space.js` does the same for 3D (`window.GeoSpace`, `FIG3`).
  `problems-plane.js` / `problems-space.js` hold the exam-problem figures. List every `.js` under
  `resources:` in the front matter.
- In the page: `::: {.geo-fig data-fig="NAME"}` draws `FIG[NAME](g, "")`; with
  `data-mode="solution"` it draws the solution version, whose steps advance with
  `stepper(g, steps)` (plane) or `steps3(g, list)` (3D) and the button "Próximo passo".
- Each problem is a collapsed `::: {.callout-note .geo-problem collapse="true" icon="false"}` with
  the statement and figure, and inside it a collapsed `callout-tip` with the answer and solution.
  Titles: `Problema · Fuvest 2026, 2ª fase, questão 3` / `Resposta e resolução`;
  `Problema da IMO · IMO 2018, Problema 1` / `Resolução`. Write `(A\)` and `a\)` so Pandoc does not
  turn the alternatives into lists.
- Each section ends with `▶ Veja na animação: [Title, a partir de m:ss](../../manim/<slug>/index.html?t=N).`
- JSXGraph pitfalls: never pass a raw `[x, y]` array to `angle`, `arc` or similar — JSXGraph then
  creates a visible point with an automatic name (A, B, …) that clashes with the figure's letters;
  use `g.fixed(b, x, y, "", { visible: false })`. Angle names are placed on the bisector past the
  arc automatically; for thin angles write the value outside with `polarText` / `bisText`
  (problems-plane.js). `segText(b, P, Q, s, awayPoint, { off })` puts a side label away from a point.
- 3D labels (`v.label`) are placed by hand: after changing a view, check every label again.
- Test before delivering: render in a browser (Playwright, Chromium) every figure, step through all
  solutions, and look at screenshots of the first and last step.

## Notes in Portuguese (for Brazilian students)

- `lang: pt`; macros after the front matter: `\newcommand{\sen}{\operatorname{sen}}`,
  `\newcommand{\tg}{\operatorname{tg}}`, `\newcommand{\cotg}{\operatorname{cotg}}`.
  Use sen, tg, cotg, arcsen; never sin, tan in the text or the figures.
- Decimal comma everywhere: `0{,}86` in LaTeX; in the figures `fmt()` already writes a comma
  (use `fmt` for slider values too, never `toFixed` directly). Area unit: "u.a.". Euler:
  V − A + F = 2. Spelling: Heron.
- Exam statements are translated unless Lucas provides the original text. No links to Poliedro,
  Etapa or AoPS in individual problems: they are credited once, in the "Referências" section at the
  end of the note.

## Review checklist for figures and solutions (Lucas's rules)

- No numerical approximations (≈) unless the exercise asks for a number: keep exact values
  (25√6/3, 12/√41). No numerical "checks" in the solutions ("aqui …", "= 20,002 = 20").
  Numbers on sliders in the statement figures are fine when they help.
- No label, angle value or line name over a line, an arc or another label.
- One meaning per letter inside a problem (e.g. the line is s, the radius is r).
- Every quantity used in a formula, and every point named in the text, appears in the figure.
- Explain why non-obvious steps are valid (e.g. why adding the three equations solves the system).

## Manim videos with chapter links (model: `manim/basic-geometry/`)

- Source `~/Documents/manimations/basic_geometry.py`, one scene; each chapter starts with
  `self.chapter(key, n, title)`, and a full render writes the start times to
  `basic_geometry_chapters.json`. While editing: `BG_ONLY=key1,key2 uv run manim -pql …`
  (partial renders do not write the times).
- After every full re-render the times shift (Write animations depend on the text length): update
  every `?t=N` (N = whole seconds) in the note and the table "Tempo | Capítulo" on the animation page.
  The page's seek script opens the video at `?t=N`.
- Every letter in an on-screen formula must also be drawn in the picture; 3D labels use
  `label3` / `label3f` (dark outline, following moving points).
- 1080p60 is the best size for Instagram (it does not show more than 1080 px wide); vertical 9:16
  versions need a separate render.

## Drafts and publishing

- A draft stays unpublished by listing its folders in `.gitignore` (under the comment "Drafts, not
  published yet"); remove those lines to publish. Do not use `draft: true`, and never run
  `quarto publish` locally while drafts exist — publish only by pushing to `main`.

## Commands

- `quarto preview` — live preview at localhost.
- `quarto render` — full build into `_site/` (check for warnings before committing).
- Publishing happens on push to `main`; do not commit `_site/`.
