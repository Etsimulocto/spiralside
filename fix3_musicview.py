#!/usr/bin/env python3
# SPIRALSIDE fix3_musicview.py
# Fix visualizer + progress dying on second open
# Root cause: createMediaElementSource called twice on same element
# Fix: hoist audio context to module level, never recreate it
# Run from ~/spiralside: py fix3_musicview.py

import os

BASE = os.path.dirname(os.path.abspath(__file__))

def read(p):
    return open(os.path.join(BASE, p), encoding='utf-8').read()

def write(p, c):
    open(os.path.join(BASE, p), 'w', encoding='utf-8').write(c)
    print('  wrote: ' + p)

def patch(p, old, new, label):
    c = read(p)
    if old not in c:
        print('  SKIP (not found): ' + label)
        print('  context: ' + repr(c[max(0,c.find('analyser')-50):c.find('analyser')+100]))
        return False
    write(p, c.replace(old, new, 1))
    print('  OK: ' + label)
    return True

print('Fixing music visualizer...')

# The fix: move audioCtx/sourceNode/analyser/dataArr to module-level
# and NEVER null them out in destroyMusicView.
# Only stop the RAF loop on destroy. Re-init just restarts RAF + redraws DOM.

OLD_DESTROY = '''// ── DESTROY ───────────────────────────────────────────────────
export function destroyMusicView() {
  stopRaf();
  const el = document.getElementById('view-music');
  if (el) el.innerHTML = '';
}'''

NEW_DESTROY = '''// ── DESTROY ───────────────────────────────────────────────────
// Only stop the animation loop — do NOT touch audioCtx or sourceNode.
// createMediaElementSource can only be called once per audio element;
// nulling sourceNode and recreating it on the next open breaks the analyser.
export function destroyMusicView() {
  stopRaf();
  const el = document.getElementById('view-music');
  if (el) el.innerHTML = '';
  // audioCtx, sourceNode, analyser, dataArr all stay alive
}'''

patch('js/app/musicview.js', OLD_DESTROY, NEW_DESTROY, 'destroyMusicView: keep audioCtx alive')

# Fix setupAnalyser: resume suspended context (browser suspends after user leaves)
OLD_ANALYSER = '''// ── ANALYSER SETUP ────────────────────────────────────────────
function setupAnalyser() {
  const ms = getMusicState();
  if (!ms?.audio) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (!sourceNode) {
      sourceNode = audioCtx.createMediaElementSource(ms.audio);
      analyser   = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      dataArr    = new Uint8Array(analyser.frequencyBinCount);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    }
  } catch {
    analyser = null; // fallback: draw idle ring
  }
}'''

NEW_ANALYSER = '''// ── ANALYSER SETUP ────────────────────────────────────────────
// Called every time music view opens.
// AudioContext and sourceNode are created only once (module-level singletons).
// On subsequent opens we just resume the suspended context.
function setupAnalyser() {
  const ms = getMusicState();
  if (!ms?.audio) return;
  try {
    if (!audioCtx) {
      // First ever open: create everything
      audioCtx   = new (window.AudioContext || window.webkitAudioContext)();
      sourceNode = audioCtx.createMediaElementSource(ms.audio);
      analyser   = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      dataArr    = new Uint8Array(analyser.frequencyBinCount);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    } else {
      // Subsequent opens: browser may have suspended the context — resume it
      if (audioCtx.state === 'suspended') audioCtx.resume();
    }
  } catch(e) {
    console.warn('[musicview] analyser setup failed:', e.message);
    analyser = null; // graceful fallback: draw idle ring
  }
}'''

patch('js/app/musicview.js', OLD_ANALYSER, NEW_ANALYSER, 'setupAnalyser: resume on reopen')

# Also fix: updateProgress checks title mismatch to sync — but the title
# element may not exist yet when the RAF fires between destroyMusicView
# clearing innerHTML and initMusicView rebuilding it. Add a guard.
OLD_PROGRESS = '''  // Track changed — resync title + queue
  if (ms.title !== (document.getElementById('mv-title')?.textContent)) syncUI();'''

NEW_PROGRESS = '''  // Track changed — resync title + queue (only if view is built)
  const titleEl2 = document.getElementById('mv-title');
  if (titleEl2 && ms.title !== titleEl2.textContent) syncUI();'''

patch('js/app/musicview.js', OLD_PROGRESS, NEW_PROGRESS, 'updateProgress: guard against missing title el')

print()
mv = read('js/app/musicview.js')
print('destroyMusicView fix:  ' + ('OK' if 'audioCtx, sourceNode, analyser' in mv else 'FAIL'))
print('setupAnalyser fix:     ' + ('OK' if 'Subsequent opens' in mv else 'FAIL'))
print('updateProgress guard:  ' + ('OK' if 'titleEl2' in mv else 'FAIL'))
print()
print('Run:')
print('  git add .')
print('  git commit -m "fix: musicview analyser survives reopen"')
print('  git push')
