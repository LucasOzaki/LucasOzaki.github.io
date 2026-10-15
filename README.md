# LucasOzaki.github.io

Source of my academic website, built with [Quarto](https://quarto.org) and published with
GitHub Pages at <https://LucasOzaki.github.io>.

```
LucasOzaki.github.io/
├── _quarto.yml                  site config: navbar, search, theme, math
├── index.qmd                    Home: photo, position, bio, links
├── research/
│   ├── index.qmd                Research page
│   ├── papers.yml               ← your papers live here (one entry each)
│   └── papers.ejs.md            template that groups/numbers them
├── teaching/
│   ├── index.qmd                list of courses (instructor / TA)
│   └── calculus-1-2025/         one folder per course with material
│       ├── index.qmd            auto-generated table of sheets
│       ├── lista-01.qmd         solution sheet written in Quarto (web + PDF)
│       ├── pdf-sheets.yml       sheets that only exist as PDFs
│       └── lista-02.pdf/.tex    a sheet written in LaTeX
├── notes/
│   ├── index.qmd                card grid of articles
│   └── kurzweil-integral/       one article: theorems, proof, citations, Python figure
├── manim/
│   ├── index.qmd                card grid of animations
│   └── gauge-fine-division/     .mp4 + thumbnail.png + page with code excerpts
├── www/styles.scss              colors, fonts, paper list, theorem boxes
├── www/images/                  profile.png (placeholder), favicon.png
├── _freeze/                     stored results of Python chunks (commit this)
├── .github/workflows/publish.yml  rebuilds and publishes on every push
└── CLAUDE.md                    instructions Claude Code reads in this folder
```

## 1. One-time setup on the Mac

```bash
xcode-select --install                     # git and compilers (skip if already installed)
# Homebrew, if `brew --version` fails: see https://brew.sh
brew install --cask quarto
brew install gh uv cairo pkg-config        # GitHub CLI, Python manager, Manim dependencies
```

You already have MacTeX (needed for the PDF versions of solution sheets and for `MathTex` in Manim).

In **VS Code**, install the extensions **Quarto** (`quarto.quarto`) and **Python**.
The Quarto extension gives a *Preview* button, completion for YAML options, and math preview.

Python environment for this project (Jupyter for the Notes figures, Manim for animations):

```bash
cd LucasOzaki.github.io
uv venv                                     # creates .venv/ (ignored by git)
source .venv/bin/activate
uv pip install jupyter matplotlib manim
manim checkhealth
```

## 2. Work on the site

```bash
source .venv/bin/activate
quarto preview          # opens http://localhost:XXXX and reloads on every save
quarto render           # full build into _site/ (run before committing; watch for warnings)
```

## 3. Put it online (first time only)

1. On GitHub, create an **empty public repository named exactly `LucasOzaki.github.io`**.
2. Push this folder:
   ```bash
   git init -b main
   git add .
   git commit -m "First version of the website"
   gh auth login                                   # once
   gh repo create LucasOzaki/LucasOzaki.github.io --public --source=. --push
   ```
   (If you already created the repository on the website, use
   `git remote add origin https://github.com/LucasOzaki/LucasOzaki.github.io.git && git push -u origin main` instead.)
3. Publish once from your Mac: `quarto publish gh-pages`. It creates `_publish.yml`; commit and push it
   (`git add _publish.yml && git commit -m "Add publish config" && git push`).
4. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / `(root)`**.
   For a user site (`username.github.io`) GitHub defaults to `main`, so this step is needed.
5. On GitHub: **Settings → Actions → General → Workflow permissions → Read and write permissions**.

From then on, every `git push` to `main` rebuilds and republishes the site automatically
(`.github/workflows/publish.yml`). The site appears at <https://LucasOzaki.github.io> after a minute or two.

## 4. Everyday tasks

**Add a paper.** Add an entry to `research/papers.yml` (instructions are at the top of the file).
Leave `coauthors` empty for a single-authored paper. When a paper is accepted, change its `status`
and add `journal`, `details`, `doi`; it moves to the right section by itself.

**Add a course with solutions.** Create `teaching/<course>-<year>/`, copy `index.qmd` and
`lista-01.qmd` from the example, and add a line to `teaching/index.qmd`.
- Solutions written in Quarto get a web page with collapsible solutions *and* a PDF download.
- Solutions you already have as LaTeX PDFs: drop the PDF in the folder and add it to `pdf-sheets.yml`.
- Only publish solutions after the deadline, and check with the course's professor first.

**Add a note (expository article).** Copy `notes/kurzweil-integral/` to a new folder and edit.
Theorem-like environments: `::: {#thm-name}`, `#lem-`, `#def-`, `#exr-`, then `::: {.proof}`.
Cite with `[@key]` from the folder's `references.bib`. If you change a Python chunk, run
`quarto render` and commit the updated `_freeze/` folder.

**Add an animation.** Write and render the scene in `~/Documents/manimations` (the sources stay there
and are not published):
```bash
cd ~/Documents/manimations
uv run manim -qh my_scene.py MyScene        # video → media/videos/my_scene/1080p60/MyScene.mp4
uv run manim -qh -s my_scene.py MyScene     # last frame → media/images/my_scene/...png
```
Create `manim/<slug>/`, copy the video and the frame there (as `<slug>.mp4` and `thumbnail.png`) and
write `index.qmd`: `{{< video <slug>.mp4 >}}`, then short excerpts of the code with numbered
annotations (see the existing pages).
Keep videos under ~20 MB; host longer ones on YouTube and embed them with `{{< video https://youtu.be/ID >}}`.

## 5. Before going public: replace the placeholders

- [ ] `www/images/profile.png` → your photo (square). Keep the file name or update `index.qmd`.
- [ ] `index.qmd` → email, Google Scholar, ORCID, Lattes links; years and degrees in *Short bio*.
- [ ] `research/index.qmd` → the profile links under the introduction.
- [ ] `teaching/` → replace the example course with your real ones (or delete it).
- [ ] `research/papers.yml` → check titles, co-authors and statuses.

## 6. Working with Claude Code in this folder

Open a terminal in this folder (or the Claude Code panel in VS Code) and run `claude`.
It reads `CLAUDE.md`, so it already knows the layout and conventions. Typical requests:

- “Add my papers from `~/tese/meus-artigos.bib` to `research/papers.yml`. Don't invent missing fields.”
- “Convert `~/Monitoria/calculo2/lista3.tex` into `teaching/calculus-2-2026/lista-03.qmd`, render it and fix any errors.”
- “Write a Manim scene showing the solution of a linear GODE with a jump, render it at low quality and show me the last frame.”
- “Run `quarto render`, then check every page for broken links and missing images.”
- “Commit and push my changes with a clear message.”

Review what it changes (especially mathematics and bibliographic data) before pushing.
