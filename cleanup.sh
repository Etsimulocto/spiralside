#!/bin/bash
# ============================================================
# SPIRALSIDE — REPO CLEANUP
# Moves icons to /icons folder, removes junk files
# Run from ~/spiralside in Git Bash
# ============================================================

set -e
cd ~/spiralside

echo "🧹 Cleaning up repo..."

# ── MOVE ICONS INTO /icons FOLDER ────────────────────────
mkdir -p icons

if [ -f "icon-192.png" ]; then
  git mv icon-192.png icons/icon-192.png
  echo "✅ Moved icon-192.png → icons/"
fi

if [ -f "icon-512.png" ]; then
  git mv icon-512.png icons/icon-512.png
  echo "✅ Moved icon-512.png → icons/"
fi

# ── REMOVE JUNK FILES ────────────────────────────────────
if [ -f "index (5).html" ]; then
  git rm "index (5).html"
  echo "✅ Removed index (5).html"
fi

# ── REMOVE OLD MONOLITH FILES (no longer needed) ─────────
if [ -f "comic-viewer.js" ]; then
  git rm comic-viewer.js
  echo "✅ Removed comic-viewer.js (replaced by js/app/comic.js)"
fi

if [ -f "fix_comic.sh" ]; then
  git rm fix_comic.sh
  echo "✅ Removed fix_comic.sh"
fi

if [ -f "migrate.sh" ]; then
  git rm migrate.sh
  echo "✅ Removed migrate.sh"
fi

if [ -f "install_modules.sh" ]; then
  git rm install_modules.sh
  echo "✅ Removed install_modules.sh"
fi

# ── COMMIT AND PUSH ───────────────────────────────────────
echo ""
echo "📦 Committing..."
git add .
git commit -m "chore: clean up repo — move icons to /icons, remove old scripts"

echo "🚀 Pushing..."
git pull --rebase origin main
git push

echo ""
echo "✅ Done! Repo structure is now:"
echo "   icons/icon-192.png"
echo "   icons/icon-512.png"
echo "   manifest.json"
echo "   index.html"
echo "   js/app/..."
echo "   comics/..."
