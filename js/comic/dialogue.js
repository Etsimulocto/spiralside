// ============================================================
// SPIRALSIDE — COMIC DIALOGUE v1.0
// Typewriter effect, speaker color mapping, line sequencing
// State is module-level — one comic plays at a time
// Nimbis anchor: js/comic/dialogue.js
// ============================================================

// Module-level state for current typewriter session
let typing  = null;   // active setInterval handle
let lineIdx = 0;      // which dialogue line is currently typing

// Returns current lineIdx for tap handler in viewer.js
export function getLineIdx() { return lineIdx; }

// Returns true if typewriter is currently active
export function isTyping() { return typing !== null; }

// Instantly completes the current line (tap while typing)
export function flushLine(lines) {
  if (!typing) return;
  clearInterval(typing);
  typing = null;

  // Write full text immediately
  const line = lines[lineIdx];
  if (!line) return;
  document.getElementById('comic-text').textContent    = line.text;
  document.getElementById('comic-speaker').textContent =
    line.speaker === 'narrator' ? '' : line.speaker;
  document.getElementById('comic-speaker').className   = line.speaker.toLowerCase();
}

// Starts typing a line at index idx within the lines array
// Auto-advances to next line in same panel after pause
export function typeLine(lines, idx) {
  if (!lines.length) return;
  lineIdx = idx;
  if (idx >= lines.length) return;

  const line       = lines[idx];
  const speakerEl  = document.getElementById('comic-speaker');
  const textEl     = document.getElementById('comic-text');

  // Set speaker label and color class
  speakerEl.textContent = line.speaker === 'narrator' ? '' : line.speaker;
  speakerEl.className   = line.speaker.toLowerCase();
  textEl.textContent    = '';

  // Clear any previous typewriter
  if (typing) clearInterval(typing);

  let i = 0;
  // Narrator types slower for dramatic effect
  const speed = line.speaker === 'narrator' ? 32 : 20;

  typing = setInterval(() => {
    textEl.textContent += line.text[i++];

    if (i >= line.text.length) {
      // Line finished
      clearInterval(typing);
      typing = null;

      // Auto-advance to next line in same panel after pause
      if (idx + 1 < lines.length) {
        setTimeout(() => typeLine(lines, idx + 1), 1100);
      }
    }
  }, speed);
}
