# -*- coding: utf-8 -*-
import sys
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

trace_html = """    <div id="test-trace" class="hidden">
      <div class="test-progress-bar">
        <div id="trace-progress-fill" class="test-progress-fill"></div>
      </div>
      <div id="trace-progress-text" class="test-progress-text">1 / 10</div>
      
      <!-- English trace -->
      <div class="trace-canvas-container">
        <span class="trace-label">English</span>
        <button id="trace-en-clear-btn" class="trace-clear-btn">지우기</button>
        <canvas id="trace-en-canvas" class="trace-canvas"></canvas>
      </div>
      
      <!-- Korean trace -->
      <div class="trace-canvas-container">
        <span class="trace-label">한국어</span>
        <button id="trace-ko-clear-btn" class="trace-clear-btn">지우기</button>
        <canvas id="trace-ko-canvas" class="trace-canvas"></canvas>
      </div>
      
      <!-- Accuracy Feedback -->
      <div class="trace-acc-container">
        <div class="trace-acc-item">
          <span class="trace-acc-label">영어 정확도</span>
          <div class="trace-acc-bar-bg">
            <div id="trace-en-acc-bar" class="trace-acc-bar-fill"></div>
          </div>
          <span id="trace-en-acc-text" style="font-size: 11px; text-align:right;">0%</span>
        </div>
        <div class="trace-acc-item">
          <span class="trace-acc-label">한글 정확도</span>
          <div class="trace-acc-bar-bg">
            <div id="trace-ko-acc-bar" class="trace-acc-bar-fill"></div>
          </div>
          <span id="trace-ko-acc-text" style="font-size: 11px; text-align:right;">0%</span>
        </div>
      </div>
      
      <div id="trace-feedback" class="short-feedback"></div>
      
      <div class="test-card-actions" style="margin-top:auto;">
        <button id="trace-close-btn" class="test-btn secondary-btn">그만하기</button>
        <button id="trace-skip-btn" class="test-btn secondary-btn hidden">넘어가기</button>
        <button id="trace-submit-btn" class="test-btn primary-btn">채점하기</button>
      </div>
    </div>"""

html = html.replace('<div id="test-result"', trace_html + '\n\n    <div id="test-result"')
html = html.replace('<option value="short">📝 주관식</option>', '<option value="short">📝 주관식</option>\n            <option value="trace">✏️ 따라쓰기</option>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
