src      = open('index.html', encoding='utf-8').read()
new_html = open('_new_input.txt', encoding='utf-8').read()
# Exact old block — copy from sed output
old_html = '''    <input type="file" id="file-input-chat" style="display:none" accept="image/*,.txt,.md,.pdf" />
    <div class="chat-input-area">
    <div id="input-menu" class="input-menu">
      <div class="input-menu-section" id="input-menu-models">
        <button class="input-menu-btn model-opt active" id="iopt-haiku" onclick="selectModel('haiku');updateInputMenu()">
          <span class="iopt-icon">⚡</span>
          <span class="iopt-label">Haiku</span>
          <span class="iopt-cost">1 cr</span>
        </button>
        <button class="input-menu-btn model-opt" id="iopt-4o" onclick="selectModel('4o');updateInputMenu()">
          <span class="iopt-icon">🌀</span>
          <span class="iopt-label">Sky / 4o</span>
          <span class="iopt-cost">2 cr</span>
        </button>
        <button class="input-menu-btn model-opt" id="iopt-sonnet" onclick="selectModel('sonnet');updateInputMenu()">
          <span class="iopt-icon">✦</span>
          <span class="iopt-label">Sonnet</span>
          <span class="iopt-cost">6 cr</span>
        </button>
      </div>
      <div class="input-menu-divider"></div>
      <div class="input-menu-section">
        <button class="input-menu-btn" onclick="document.getElementById('file-input-chat').click();toggleInputMenu()">
          <span class="iopt-icon">📎</span>
          <span class="iopt-label">attach file</span>
        </button>
        <button class="input-menu-btn" onclick="switchView('imagine');toggleInputMenu()">
          <span class="iopt-icon">🎨</span>
          <span class="iopt-label">imagine</span>
        </button>
      </div>
    </div>
      <div class="input-row">
        <textarea id="msg-input" rows="1" placeholder="say something..."></textarea>
        <div class="input-actions">
          <button class="icon-btn" id="plus-btn" onclick="toggleInputMenu()" title="options">+</button>
          <button class="send-btn" id="send-btn">↑</button>
        </div>
      </div>
    </div>
  </div>'''
assert old_html in src, 'OLD BLOCK NOT FOUND — check exact text'
src = src.replace(old_html, new_html, 1)
open('index.html', 'w', encoding='utf-8').write(src)
import os; os.remove('_new_input.txt')
print('done, new len:', len(src))