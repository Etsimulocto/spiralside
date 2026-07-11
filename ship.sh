#!/bin/bash
# ship.sh — install latest BloomStudio from Design, validate, deploy
# Run from ~/spiralside

set -e
cd ~/spiralside

# --- Find newest BloomStudio export ---
# Design exports land in Downloads as "BloomStudio (NN).html"
DL="$HOME/Downloads"
newest=$(ls -t "$DL"/BloomStudio*.html 2>/dev/null | head -1)

if [ -z "$newest" ]; then
  echo "No BloomStudio export found in $DL"
  exit 1
fi

echo "newest candidate: $newest"

# --- Validate ---
if grep -q "bloomstudio" "$newest"; then
  echo "PASS  looks like the game maker (bloomstudio marker)"
else
  echo "FAIL  missing bloomstudio marker — wrong file?"
  exit 1
fi

if grep -q "screen-app" "$newest"; then
  echo "FAIL  this is a spiralside shell (has screen-app), not BloomStudio"
  exit 1
else
  echo "PASS  is NOT a spiralside shell (no screen-app)"
fi

filesize=$(wc -c < "$newest")
if [ "$filesize" -gt 200000 ]; then
  echo "PASS  is a real build (> 200 KB)"
else
  echo "FAIL  file too small ($filesize bytes) — partial export?"
  exit 1
fi

# --- Install ---
oldsize=0
if [ -f "bloomstudio/index.html" ]; then
  oldsize=$(wc -c < "bloomstudio/index.html")
fi

cp "$newest" bloomstudio/index.html

newsize=$(wc -c < "bloomstudio/index.html")
diff=$((newsize - oldsize))
sign="+"
if [ "$diff" -lt 0 ]; then sign=""; fi

echo "installed: $newest"
echo "old build: $oldsize bytes  ->  new build: $newsize bytes (${sign}${diff})"

# --- Deploy ---
echo "Test locally first:  start bloomstudio/index.html"
echo "Check the console version line matches the Design build."
echo "Then ship it:"
echo "  git add . && git commit -m \"gamemaker: <what changed>\" && git push origin main"
echo "RITUAL: prepend an entry to updates.json so the whats-new"
echo "panel announces it. Periodically archive the same file to the"
echo "BloomStudio repo as canonical bloomstudio.html."

git add .
git commit -m "gamemaker: design iteration" || true
git push origin main
