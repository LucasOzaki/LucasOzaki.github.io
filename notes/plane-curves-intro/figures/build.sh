#!/bin/sh
# Rebuild the SVG figures of this note from their TikZ sources.
# Needs latex and dvisvgm, which come with MacTeX. Run it from anywhere:
#   sh notes/plane-curves-intro/figures/build.sh
cd "$(dirname "$0")" || exit 1
for f in *.tex; do
  name="${f%.tex}"
  latex -interaction=nonstopmode -halt-on-error "$f" > /dev/null || { echo "LaTeX error in $f (see $name.log)"; continue; }
  dvisvgm --no-fonts --exact-bbox -o "$name.svg" "$name.dvi" > /dev/null 2>&1 && rm -f "$name.log" && echo "built $name.svg"
done
rm -f ./*.aux ./*.dvi
