#!/bin/bash
# ============================================================
# deploy_canon_forge.sh
# Copies canon_forge.py into the spiralside repo and patches
# app.py to add the Canon Forge tab. Run from Git Bash.
# ============================================================

set -e

REPO_DIR="C:/Users/quart/spiralside"
FORGE_FILE="canon_forge.py"

echo "=== CANON FORGE DEPLOY ==="
echo ""

# -- 1. copy canon_forge.py into repo
echo "[1/4] Copying canon_forge.py to repo..."
cp "$(dirname "$0")/$FORGE_FILE" "$REPO_DIR/$FORGE_FILE"
echo "      Done."

# -- 2. patch app.py — add import at top and tab at bottom
echo "[2/4] Patching app.py..."

cd "$REPO_DIR"

# check if already patched
if grep -q "canon_forge" app.py; then
  echo "      app.py already has canon_forge import — skipping patch."
else
  node -e "
const fs = require('fs');
let content = fs.readFileSync('app.py', 'utf8');

// Add import after the last existing import block
// We look for the first blank line after imports and insert there
const importLine = 'from canon_forge import build_canon_forge_tab';

// Insert import near top after existing imports
// Find position after 'import anthropic' or similar
const importInsert = content.indexOf('\n\n');
if (importInsert === -1) {
  console.error('Could not find import insertion point');
  process.exit(1);
}
content = content.slice(0, importInsert) + '\n' + importLine + content.slice(importInsert);

// Add the tab before the closing of the main Blocks/Tabs context
// Look for the last gr.Tab block and insert after it
// We target the pattern of the last with gr.Tab line
const tabCode = \`
    with gr.Tab(\"⚙ Canon Forge\"):
        build_canon_forge_tab()
\`;

// Find a safe insertion point — before 'demo.launch' or 'demo.queue'
const launchIdx = content.lastIndexOf('demo.launch');
const queueIdx = content.lastIndexOf('demo.queue');
let insertIdx = Math.min(
  launchIdx !== -1 ? launchIdx : Infinity,
  queueIdx !== -1 ? queueIdx : Infinity
);

if (insertIdx === Infinity) {
  console.error('Could not find demo.launch or demo.queue in app.py');
  process.exit(1);
}

// Walk back to find the preceding newline
while (insertIdx > 0 && content[insertIdx-1] !== '\n') insertIdx--;

content = content.slice(0, insertIdx) + tabCode + '\n' + content.slice(insertIdx);

fs.writeFileSync('app.py', content, 'utf8');
console.log('app.py patched successfully.');
"
fi

echo "      Done."

# -- 3. git add, commit, push
echo "[3/4] Committing and pushing to HF Space..."
git add canon_forge.py app.py
git commit -m "feat: add Canon Forge tab — session transcript to essence block converter"
git push
echo "      Done."

echo ""
echo "[4/4] All done! HF Space will rebuild in ~1 min."
echo "      Watch: https://huggingface.co/spaces/quarterbitgames/spiralside"
echo ""
echo "=== CANON FORGE DEPLOYED ==="
