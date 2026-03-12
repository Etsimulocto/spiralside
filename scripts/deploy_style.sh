#!/bin/bash
# deploy_style.sh — patches index.html and pushes to GitHub
set -e

cd ~/spiralside

echo "Running style injector..."
python3 /tmp/inject_style.py

echo "Committing..."
git add index.html
git commit -m "feat: style editor — themes, particles, bg types, font/color pickers, FAB item"
git push

echo ""
echo "Done! Vercel will deploy in ~30 seconds."
echo "Open spiralside.com, tap the spiral FAB, select style."
