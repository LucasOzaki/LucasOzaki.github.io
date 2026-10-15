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

## Commands

- `quarto preview` — live preview at localhost.
- `quarto render` — full build into `_site/` (check for warnings before committing).
- Publishing happens on push to `main`; do not commit `_site/`.
