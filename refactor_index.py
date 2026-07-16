import sys

def refactor_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Remove API key badge and button
    old_badge_row = '''      <div class="badge-row">
        <span class="badge badge-ai">✦ AI 자동 추출</span>
        <span class="badge badge-compat">굿노트 호환</span>
        <span id="api-key-status" class="key-status"></span>
        <button id="change-key-btn" class="key-change-btn" title="API 키 변경">🔑 API 키</button>
      </div>'''
    new_badge_row = '''      <div class="badge-row">
        <span class="badge badge-ai">✦ 수동 AI 추출</span>
        <span class="badge badge-compat">굿노트 호환</span>
      </div>'''
    if old_badge_row in html:
        html = html.replace(old_badge_row, new_badge_row)
    else:
        print('Could not find badge_row')

    # 2. Replace extract-section contents
    start_tag = '          <!-- Tabs -->'
    end_tag = '        <!-- Words Table -->'
    
    start_idx = html.find(start_tag)
    end_idx = html.find(end_tag)
    
    if start_idx != -1 and end_idx != -1:
        new_content = '''          <!-- Options -->
          <div class="options-grid" style="margin-top:0.5rem; margin-bottom:1.5rem;">
            <div class="option-card">
              <label class="option-label" for="card-front-sel">📌 앞면</label>
              <select id="card-front-sel" class="select-input">
                <option value="word">단어만</option>
                <option value="word_pos">단어+품사</option>
                <option value="word_pron">단어+발음</option>
              </select>
            </div>
            <div class="option-card">
              <label class="option-label" for="card-back-sel">📝 뒷면</label>
              <select id="card-back-sel" class="select-input">
                <option value="full" selected>뜻+예문+유의어</option>
                <option value="meaning_example">뜻+예문</option>
                <option value="meaning_only">뜻만</option>
              </select>
            </div>
          </div>

          <!-- Step 1: Copy Prompt -->
          <div class="step-card" style="margin-bottom:1.5rem; border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; background: var(--bg-card);">
            <h4 style="margin: 0 0 10px 0; color: var(--primary); font-size: 1.1rem;">1단계: 프롬프트 복사하기</h4>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 15px;">
              아래 프롬프트를 복사하여 ChatGPT, Claude, 또는 Gemini에 단어책 사진이나 텍스트와 함께 붙여넣으세요.
            </p>
            <div class="textarea-wrap" style="position:relative;">
              <textarea id="prompt-output" class="vocab-textarea" rows="6" readonly style="background-color: var(--bg-body); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; padding-right: 90px; color: var(--text); border: 1px solid var(--border); resize: none;"></textarea>
              <button id="copy-prompt-btn" class="generate-btn" style="position: absolute; right: 10px; top: 10px; width: auto; padding: 0.5rem 1rem; font-size: 0.85rem; z-index: 10;">📋 복사</button>
            </div>
          </div>

          <!-- Step 2: Paste JSON -->
          <div class="step-card" style="border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; background: var(--bg-card); margin-bottom: 1.5rem;">
            <h4 style="margin: 0 0 10px 0; color: var(--primary); font-size: 1.1rem;">2단계: AI 결과 붙여넣기</h4>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 15px;">
              외부 AI가 답변해준 결과(코드 블록 전체 또는 텍스트 전부)를 아래에 붙여넣으세요.
            </p>
            <div class="textarea-wrap">
              <textarea id="ai-json-input" class="vocab-textarea" placeholder="[\n  {\n    &quot;front&quot;: &quot;apple&quot;,\n    &quot;back&quot;: &quot;사과&quot;\n  }\n]" rows="8" spellcheck="false"></textarea>
            </div>
            <div style="margin-top:1.5rem; text-align:center;">
              <button id="convert-btn" class="generate-btn" style="font-size: 1rem; padding: 0.8rem 2rem;">
                <span class="btn-icon">⚡</span> 단어장으로 변환하기
              </button>
            </div>
          </div>
        </div>

        <!-- Words Table -->'''
        html = html[:start_idx] + new_content + html[end_idx + len('        <!-- Words Table -->'):]
    else:
        print('Could not find extract-section bounds')

    # 3. Remove api-modal
    api_modal_start = html.find('  <!-- API Key Modal -->')
    api_modal_end = html.find('  <!-- Custom Prompt Modal -->')
    if api_modal_start != -1 and api_modal_end != -1:
        html = html[:api_modal_start] + html[api_modal_end:]
    else:
        print('Could not find api modal')

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('index.html refactored successfully.')

if __name__ == "__main__":
    refactor_index()
