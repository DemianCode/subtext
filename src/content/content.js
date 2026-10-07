/**
 * Content Script for Contextual Reading & Lookup Extension.
 * Renders HUD Micro-Toolbar, Inline Definition Cards, Persistent Annotations, 
 * and Encyclopedia Side Panel inside an isolated Shadow DOM.
 */

(function () {
  if (window.hasContextualLookupInjected) return;
  window.hasContextualLookupInjected = true;

  // Global State
  let shadowHost = null;
  let shadowRoot = null;
  let activeSelectionText = '';
  let activeRange = null;
  let cachedAnnotations = new Map();
  let currentTheme = 'minimal-dark';
  
  // Highlight Settings State
  let highlightSettings = {
    enableHighlight: true,
    highlightColor: '#818cf8'
  };

  // UI Element References inside Shadow DOM
  let hudToolbarEl = null;
  let popoverCardEl = null;
  let sidebarOverlayEl = null;
  let rootContainerEl = null;

  // Initialize Shadow DOM Container
  function initShadowDOM() {
    shadowHost = document.createElement('div');
    shadowHost.id = 'ctx-lookup-extension-root';
    shadowHost.style.position = 'absolute';
    shadowHost.style.top = '0';
    shadowHost.style.left = '0';
    shadowHost.style.width = '0';
    shadowHost.style.height = '0';
    shadowHost.style.zIndex = '2147483647';
    document.documentElement.appendChild(shadowHost);

    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = getShadowDOMStyles();
    shadowRoot.appendChild(styleEl);

    // Load preferences
    loadPreferences();

    rootContainerEl = document.createElement('div');
    rootContainerEl.className = 'ctx-root-container';
    rootContainerEl.setAttribute('data-theme', currentTheme);
    rootContainerEl.innerHTML = `
      <!-- 1. FLOATING MICRO-TOOLBAR (HUD) -->
      <div id="ctx-hud" class="ctx-hud-toolbar">
        <button id="ctx-btn-define" class="ctx-hud-btn ctx-hud-btn-define" title="Define word (Alt+Shift+D)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          Define
        </button>

        <div class="ctx-hud-divider"></div>

        <button id="ctx-btn-explore" class="ctx-hud-btn ctx-hud-btn-explore" title="Explore Article (Alt+Shift+E)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
          </svg>
          Explore Article
        </button>

        <div class="ctx-hud-divider"></div>

        <button id="ctx-hud-close" class="ctx-hud-close-btn" title="Dismiss">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- 2. INLINE DEFINITION POPOVER CARD -->
      <div id="ctx-popover" class="ctx-popover-card">
        <!-- Dynamic content -->
      </div>

      <!-- 3. ENCYCLOPEDIA SIDE PANEL -->
      <div id="ctx-sidebar" class="ctx-sidebar-overlay">
        <div class="ctx-sidebar-header">
          <div class="ctx-sidebar-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Encyclopedia
          </div>

          <div class="ctx-sidebar-search-box">
            <svg class="ctx-sidebar-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input id="ctx-sidebar-input" class="ctx-sidebar-search-input" type="text" placeholder="Search topic..." />
          </div>

          <button id="ctx-sidebar-close" class="ctx-sidebar-close-btn" title="Close Panel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div id="ctx-sidebar-content" class="ctx-sidebar-body">
          <!-- Dynamic Encyclopedia Article Content -->
        </div>
      </div>
    `;

    shadowRoot.appendChild(rootContainerEl);

    hudToolbarEl = shadowRoot.getElementById('ctx-hud');
    popoverCardEl = shadowRoot.getElementById('ctx-popover');
    sidebarOverlayEl = shadowRoot.getElementById('ctx-sidebar');

    bindEvents();
  }

  function loadPreferences() {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(['theme', 'highlightSettings'], (res) => {
        if (res.theme) applyTheme(res.theme);
        if (res.highlightSettings) {
          highlightSettings = { ...highlightSettings, ...res.highlightSettings };
        }
      });
    }
  }

  function applyTheme(themeName) {
    currentTheme = themeName;
    if (rootContainerEl) {
      rootContainerEl.setAttribute('data-theme', themeName);
    }
  }

  function bindEvents() {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMousedownOutside);

    shadowRoot.getElementById('ctx-btn-define').addEventListener('click', (e) => {
      e.stopPropagation();
      triggerDefineAction(activeSelectionText);
    });

    shadowRoot.getElementById('ctx-btn-explore').addEventListener('click', (e) => {
      e.stopPropagation();
      triggerExploreAction(activeSelectionText);
    });

    shadowRoot.getElementById('ctx-hud-close').addEventListener('click', (e) => {
      e.stopPropagation();
      hideHUD();
    });

    const searchInput = shadowRoot.getElementById('ctx-sidebar-input');
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) triggerExploreAction(query);
      }
    });

    shadowRoot.getElementById('ctx-sidebar-close').addEventListener('click', () => {
      closeSidebar();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideHUD();
        hidePopoverCard();
        closeSidebar();
        return;
      }

      if ((e.altKey && e.shiftKey && e.code === 'KeyD') || (e.altKey && e.code === 'KeyD')) {
        const sel = getSelectedText();
        if (sel) {
          e.preventDefault();
          triggerDefineAction(sel);
        }
      }

      if ((e.altKey && e.shiftKey && e.code === 'KeyE') || (e.altKey && e.code === 'KeyE')) {
        const sel = getSelectedText();
        if (sel) {
          e.preventDefault();
          triggerExploreAction(sel);
        }
      }
    });

    if (window.chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((request) => {
        if (request.action === 'TRIGGER_DEFINE_SHORTCUT') {
          const text = request.query || getSelectedText();
          if (text) triggerDefineAction(text);
        } else if (request.action === 'TRIGGER_EXPLORE_SHORTCUT') {
          const text = request.query || getSelectedText();
          if (text) triggerExploreAction(text);
        } else if (request.action === 'SET_THEME') {
          applyTheme(request.theme);
        } else if (request.action === 'UPDATE_HIGHLIGHT_SETTINGS') {
          highlightSettings = { ...highlightSettings, ...request.settings };
          restyleExistingHighlights();
        } else if (request.action === 'CLEAR_PAGE_ANNOTATIONS') {
          clearAllPageAnnotations();
        }
      });
    }
  }

  function handleMouseUp(e) {
    if (e.target.closest('#ctx-lookup-extension-root')) return;
    if (e.target.classList && e.target.classList.contains('ctx-lookup-highlight')) {
      handleHighlightClick(e.target);
      return;
    }

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';

      if (text && text.length > 0 && text.length < 100) {
        activeSelectionText = text;
        try {
          activeRange = selection.getRangeAt(0).cloneRange();
          positionHUD(activeRange.getBoundingClientRect());
        } catch (err) {
          hideHUD();
        }
      } else {
        hideHUD();
      }
    }, 10);
  }

  function handleKeyUp(e) {
    if (e.key === 'Shift' || e.key.includes('Arrow')) {
      handleMouseUp(e);
    }
  }

  function handleMousedownOutside(e) {
    if (shadowHost && shadowHost.contains(e.target)) return;
    if (e.target.classList && e.target.classList.contains('ctx-lookup-highlight')) return;

    hideHUD();
    hidePopoverCard();
  }

  function getSelectedText() {
    const sel = window.getSelection();
    return sel ? sel.toString().trim() : '';
  }

  function positionHUD(rect) {
    if (!rect || rect.width === 0) return;

    hudToolbarEl.classList.add('ctx-visible');
    const hudWidth = hudToolbarEl.offsetWidth || 180;
    const hudHeight = hudToolbarEl.offsetHeight || 32;

    let top = rect.top - hudHeight - 8;
    let left = rect.left + (rect.width / 2) - (hudWidth / 2);

    if (top < 10) top = rect.bottom + 8;
    if (left < 10) left = 10;
    if (left + hudWidth > window.innerWidth - 10) {
      left = window.innerWidth - hudWidth - 10;
    }

    hudToolbarEl.style.top = `${top}px`;
    hudToolbarEl.style.left = `${left}px`;
  }

  function hideHUD() {
    if (hudToolbarEl) hudToolbarEl.classList.remove('ctx-visible');
  }

  // ==========================================================================
  // ACTION 1: DEFINE POPOVER CARD & PERSISTENT HIGHLIGHTS
  // ==========================================================================
  async function triggerDefineAction(rawWord) {
    hideHUD();
    const word = (rawWord || '').trim();
    if (!word) return;

    let defData = cachedAnnotations.get(word.toLowerCase());

    if (!defData) {
      renderPopoverSkeleton(word);
      positionPopoverNearRange(activeRange ? activeRange.getBoundingClientRect() : null);

      defData = await queryDefinitionData(word);
      if (defData) {
        cachedAnnotations.set(word.toLowerCase(), defData);
      }
    }

    if (defData) {
      renderPopoverContent(defData);
      positionPopoverNearRange(activeRange ? activeRange.getBoundingClientRect() : null);

      // Apply persistent mark if enabled in settings
      if (activeRange && !defData.notFound && highlightSettings.enableHighlight) {
        createPersistentAnnotationHighlight(word, activeRange, defData);
      }
    }

    recordLookup(word, 'definition');
  }

  async function queryDefinitionData(word) {
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'FETCH_DEFINITION', query: word }, (response) => {
          if (response && response.success && response.data) {
            resolve(response.data);
          } else {
            if (window.ContextualAPI) {
              ContextualAPI.fetchDefinition(word).then(resolve);
            } else {
              resolve(null);
            }
          }
        });
      });
    } else if (window.ContextualAPI) {
      return await ContextualAPI.fetchDefinition(word);
    }
    return null;
  }

  function renderPopoverSkeleton(word) {
    popoverCardEl.innerHTML = `
      <div class="ctx-card-header">
        <div class="ctx-card-title-group">
          <div class="ctx-card-word">${escapeHtml(word)}</div>
          <div class="ctx-card-phonetic">Fetching definition...</div>
        </div>
      </div>
      <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 6px;">
        <div class="ctx-skeleton" style="height: 14px; width: 50%;"></div>
        <div class="ctx-skeleton" style="height: 12px; width: 85%;"></div>
      </div>
    `;
    popoverCardEl.classList.add('ctx-visible');
  }

  function positionPopoverNearRange(rect) {
    if (!rect) return;
    const cardWidth = 320;
    const cardHeight = popoverCardEl.offsetHeight || 200;

    let top = rect.bottom + 8;
    let left = rect.left + (rect.width / 2) - (cardWidth / 2);

    if (top + cardHeight > window.innerHeight - 10) {
      top = rect.top - cardHeight - 8;
    }
    if (top < 10) top = 10;
    if (left < 10) left = 10;
    if (left + cardWidth > window.innerWidth - 10) {
      left = window.innerWidth - cardWidth - 10;
    }

    popoverCardEl.style.top = `${top}px`;
    popoverCardEl.style.left = `${left}px`;
  }

  function renderPopoverContent(data) {
    if (data.notFound) {
      popoverCardEl.innerHTML = `
        <div class="ctx-card-header">
          <div class="ctx-card-title-group">
            <div class="ctx-card-word">${escapeHtml(data.word)}</div>
            <div class="ctx-card-phonetic" style="color: #ef4444;">No definition found</div>
          </div>
          <button class="ctx-icon-btn ctx-card-close-btn" id="ctx-popover-close">✕</button>
        </div>
        <div class="ctx-card-body">
          <p style="font-size: 12px; color: var(--ctx-text-muted);">${escapeHtml(data.message || 'Check spelling or explore the encyclopedia.')}</p>
        </div>
        <div class="ctx-card-footer">
          <button class="ctx-footer-explore-btn" id="ctx-popover-to-explore">Explore Article →</button>
        </div>
      `;
    } else {
      const audioBtnHtml = `
        <button class="ctx-card-audio-btn" id="ctx-play-audio" title="Listen to pronunciation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
      `;

      const meaningsHtml = (data.meanings || []).map(m => `
        <div class="ctx-meaning-block">
          <span class="ctx-pos-tag">${escapeHtml(m.partOfSpeech)}</span>
          <ul class="ctx-def-list">
            ${(m.definitions || []).map(d => `
              <li class="ctx-def-item">
                ${escapeHtml(d.definition)}
                ${d.example ? `<div class="ctx-example">"${escapeHtml(d.example)}"</div>` : ''}
              </li>
            `).join('')}
          </ul>
          ${m.synonyms && m.synonyms.length > 0 ? `
            <div class="ctx-synonyms-wrap">
              ${m.synonyms.map(syn => `<span class="ctx-synonym-chip" data-syn="${escapeHtml(syn)}">${escapeHtml(syn)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('');

      popoverCardEl.innerHTML = `
        <div class="ctx-card-header">
          <div class="ctx-card-title-group">
            <div class="ctx-card-word">${escapeHtml(data.word)}</div>
            <div class="ctx-card-phonetic-row">
              <span class="ctx-card-phonetic">${escapeHtml(data.phonetic || '')}</span>
              ${audioBtnHtml}
            </div>
          </div>
          <div class="ctx-card-actions">
            <button class="ctx-icon-btn" id="ctx-save-word" title="Bookmark word">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </button>
            <button class="ctx-icon-btn" id="ctx-popover-close" title="Close">✕</button>
          </div>
        </div>

        <div class="ctx-card-body">
          ${meaningsHtml}
        </div>

        <div class="ctx-card-footer">
          <button class="ctx-footer-explore-btn" id="ctx-popover-to-explore">Explore Article →</button>
          <button class="ctx-footer-clear-btn" id="ctx-popover-remove-annotation">Clear Annotation</button>
        </div>
      `;

      const audioBtn = popoverCardEl.querySelector('#ctx-play-audio');
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          playAudioPronunciation(data.word, data.audioUrl);
        });
      }

      const synChips = popoverCardEl.querySelectorAll('.ctx-synonym-chip');
      synChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          const synWord = chip.getAttribute('data-syn');
          if (synWord) triggerDefineAction(synWord);
        });
      });

      const saveBtn = popoverCardEl.querySelector('#ctx-save-word');
      if (saveBtn) {
        saveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          saveBtn.classList.toggle('ctx-saved');
          if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'SAVE_WORD', wordData: data });
          }
        });
      }

      const clearBtn = popoverCardEl.querySelector('#ctx-popover-remove-annotation');
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeAnnotationForWord(data.word);
          hidePopoverCard();
        });
      }
    }

    const closeBtn = popoverCardEl.querySelector('#ctx-popover-close');
    if (closeBtn) closeBtn.addEventListener('click', hidePopoverCard);

    const exploreBtn = popoverCardEl.querySelector('#ctx-popover-to-explore');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        hidePopoverCard();
        triggerExploreAction(data.word);
      });
    }

    popoverCardEl.classList.add('ctx-visible');
  }

  function hidePopoverCard() {
    if (popoverCardEl) popoverCardEl.classList.remove('ctx-visible');
  }

  function playAudioPronunciation(word, audioUrl) {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => speakFallback(word));
    } else {
      speakFallback(word);
    }
  }

  function speakFallback(word) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  /**
   * Persistent Annotation Highlight Creation with Custom Color & Toggle Check
   */
  function createPersistentAnnotationHighlight(word, range, defData) {
    try {
      if (!range || range.collapsed) return;
      if (!highlightSettings.enableHighlight) return; // Respect user toggle!

      const containerNode = range.commonAncestorContainer;
      if (containerNode.nodeType === 1 && containerNode.classList.contains('ctx-lookup-highlight')) return;

      const mark = document.createElement('mark');
      mark.className = 'ctx-lookup-highlight';
      mark.setAttribute('data-word', word.toLowerCase());
      mark.setAttribute('title', `Click to view definition of "${word}"`);

      // Apply custom highlight background fill and dashed underline
      applyHighlightStyleToElement(mark, highlightSettings.highlightColor);

      range.surroundContents(mark);
      cachedAnnotations.set(word.toLowerCase(), defData);
    } catch (e) {}
  }

  function applyHighlightStyleToElement(markEl, colorHex) {
    if (!colorHex) return;
    const rgbaBg = hexToRgba(colorHex, 0.22);
    markEl.style.setProperty('background-color', rgbaBg, 'important');
    markEl.style.setProperty('border-bottom-color', colorHex, 'important');
  }

  function restyleExistingHighlights() {
    const highlights = document.querySelectorAll('mark.ctx-lookup-highlight');
    highlights.forEach(mark => {
      if (!highlightSettings.enableHighlight) {
        mark.style.setProperty('background-color', 'transparent', 'important');
        mark.style.setProperty('border-bottom-color', 'transparent', 'important');
      } else {
        applyHighlightStyleToElement(mark, highlightSettings.highlightColor);
      }
    });
  }

  function hexToRgba(hex, alpha = 0.2) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(129, 140, 248, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function handleHighlightClick(markEl) {
    const word = markEl.getAttribute('data-word');
    if (!word) return;

    const defData = cachedAnnotations.get(word.toLowerCase());
    if (defData) {
      renderPopoverContent(defData);
      positionPopoverNearRange(markEl.getBoundingClientRect());
    } else {
      triggerDefineAction(word);
    }
  }

  function removeAnnotationForWord(word) {
    if (!word) return;
    const lower = word.toLowerCase();
    cachedAnnotations.delete(lower);

    const highlights = document.querySelectorAll(`mark.ctx-lookup-highlight[data-word="${lower}"]`);
    highlights.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    });
  }

  function clearAllPageAnnotations() {
    cachedAnnotations.clear();
    const highlights = document.querySelectorAll('mark.ctx-lookup-highlight');
    highlights.forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    });
  }

  // ==========================================================================
  // ACTION 2: ENCYCLOPEDIA SIDE PANEL OVERLAY
  // ==========================================================================
  async function triggerExploreAction(rawQuery) {
    hideHUD();
    hidePopoverCard();

    const query = (rawQuery || '').trim();
    if (!query) return;

    sidebarOverlayEl.classList.add('ctx-open');
    const contentEl = shadowRoot.getElementById('ctx-sidebar-content');
    const searchInput = shadowRoot.getElementById('ctx-sidebar-input');
    searchInput.value = query;

    renderSidebarSkeleton(contentEl, query);

    const articleData = await queryEncyclopediaArticle(query);
    if (articleData) {
      renderSidebarArticle(contentEl, articleData);
    }

    recordLookup(query, 'encyclopedia');
  }

  async function queryEncyclopediaArticle(query) {
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'FETCH_ENCYCLOPEDIA', query: query }, (response) => {
          if (response && response.success && response.data) {
            resolve(response.data);
          } else {
            if (window.ContextualAPI) {
              ContextualAPI.fetchEncyclopediaArticle(query).then(resolve);
            } else {
              resolve(null);
            }
          }
        });
      });
    } else if (window.ContextualAPI) {
      return await ContextualAPI.fetchEncyclopediaArticle(query);
    }
    return null;
  }

  function renderSidebarSkeleton(container, query) {
    container.innerHTML = `
      <div style="padding: 10px 0;">
        <div class="ctx-skeleton" style="height: 140px; width: 100%; border-radius: 8px; margin-bottom: 14px;"></div>
        <div class="ctx-skeleton" style="height: 20px; width: 65%; margin-bottom: 8px;"></div>
        <div class="ctx-skeleton" style="height: 70px; width: 100%;"></div>
      </div>
    `;
  }

  function renderSidebarArticle(container, article) {
    if (article.notFound) {
      const suggestionsHtml = (article.suggestions || []).map(s => `
        <div class="ctx-accordion-item" style="padding: 10px; cursor: pointer;" data-topic="${escapeHtml(s.title)}">
          <div style="font-weight:600; font-size:13px; color:var(--ctx-text-main);">${escapeHtml(s.title)}</div>
          <div style="font-size:11.5px; color:var(--ctx-text-muted); margin-top:2px;">${escapeHtml(s.snippet)}</div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="ctx-summary-card" style="text-align: center;">
          <div style="font-weight: 600; margin-bottom: 4px;">No direct article found</div>
          <div style="font-size: 12px; color: var(--ctx-text-muted);">${escapeHtml(article.message || 'Try searching related topics below.')}</div>
        </div>
        ${suggestionsHtml ? `<div style="font-size: 11px; font-weight:600; text-transform:uppercase; color:var(--ctx-text-muted); margin: 12px 0 6px 0;">Related Topics</div>${suggestionsHtml}` : ''}
      `;

      container.querySelectorAll('[data-topic]').forEach(card => {
        card.addEventListener('click', () => {
          const topic = card.getAttribute('data-topic');
          if (topic) triggerExploreAction(topic);
        });
      });
      return;
    }

    const sectionsHtml = (article.sections || []).map(sec => `
      <div class="ctx-accordion-item">
        <div class="ctx-accordion-header">
          <span>${escapeHtml(sec.heading)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
        <div class="ctx-accordion-body" style="display: none;">
          ${escapeHtml(sec.content)}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="margin-bottom: 14px;">
        <div style="font-size: 20px; font-weight: 700; color: var(--ctx-text-main);">${escapeHtml(article.title)}</div>
        <div style="font-size: 12px; color: var(--ctx-text-muted); margin-top: 2px;">${escapeHtml(article.description || '')}</div>
      </div>

      <div class="ctx-summary-card">
        <div class="ctx-summary-label">Summary</div>
        <div class="ctx-summary-text">${escapeHtml(article.extract)}</div>
      </div>

      ${sectionsHtml}

      <a class="ctx-external-wiki-link" href="${article.desktopUrl}" target="_blank" rel="noopener noreferrer">
        <span>Read Full Wikipedia Article</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    `;

    container.querySelectorAll('.ctx-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const isOpen = body.style.display === 'block';
        body.style.display = isOpen ? 'none' : 'block';
      });
    });
  }

  function closeSidebar() {
    if (sidebarOverlayEl) sidebarOverlayEl.classList.remove('ctx-open');
  }

  function recordLookup(query, type) {
    if (window.chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'RECORD_LOOKUP', query, type });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getShadowDOMStyles() {
    return `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
      }
      .ctx-root-container, .ctx-root-container[data-theme="minimal-dark"] {
        --ctx-bg-primary: #18181b; --ctx-bg-secondary: #27272a; --ctx-bg-glass: rgba(24, 24, 27, 0.94);
        --ctx-bg-card: rgba(39, 39, 42, 0.75); --ctx-border: rgba(255, 255, 255, 0.1); --ctx-border-glow: rgba(255, 255, 255, 0.18);
        --ctx-text-main: #f4f4f5; --ctx-text-muted: #a1a1aa; --ctx-text-subtle: #71717a;
        --ctx-accent-define-bg: rgba(255, 255, 255, 0.08); --ctx-accent-define-border: rgba(255, 255, 255, 0.15);
        --ctx-accent-define-text: #e4e4e7; --ctx-accent-define-hover: #3f3f46;
        --ctx-highlight-bg: rgba(255, 255, 255, 0.12); --ctx-highlight-border: #a1a1aa;
        --ctx-shadow-hud: 0 8px 24px rgba(0, 0, 0, 0.35); --ctx-shadow-lg: 0 16px 32px rgba(0, 0, 0, 0.45);
        --ctx-radius: 10px; --ctx-radius-sm: 6px; --ctx-radius-pill: 9999px; --ctx-transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .ctx-root-container[data-theme="nordic-slate"] {
        --ctx-bg-primary: #0f172a; --ctx-bg-secondary: #1e293b; --ctx-bg-glass: rgba(15, 23, 42, 0.94);
        --ctx-bg-card: rgba(30, 41, 59, 0.75); --ctx-border: rgba(255, 255, 255, 0.09); --ctx-border-glow: rgba(56, 189, 248, 0.25);
        --ctx-text-main: #f8fafc; --ctx-text-muted: #94a3b8; --ctx-text-subtle: #64748b;
        --ctx-accent-define-bg: rgba(148, 163, 184, 0.12); --ctx-accent-define-border: rgba(148, 163, 184, 0.2);
        --ctx-accent-define-text: #cbd5e1; --ctx-accent-define-hover: #334155;
        --ctx-highlight-bg: rgba(56, 189, 248, 0.15); --ctx-highlight-border: #38bdf8;
      }
      .ctx-root-container[data-theme="warm-sepia"] {
        --ctx-bg-primary: #1c1917; --ctx-bg-secondary: #292524; --ctx-bg-glass: rgba(28, 25, 23, 0.95);
        --ctx-bg-card: rgba(41, 37, 36, 0.8); --ctx-border: rgba(231, 229, 228, 0.1); --ctx-border-glow: rgba(217, 119, 6, 0.25);
        --ctx-text-main: #f5f5f4; --ctx-text-muted: #a8a29e; --ctx-text-subtle: #78716c;
        --ctx-accent-define-bg: rgba(217, 119, 6, 0.12); --ctx-accent-define-border: rgba(217, 119, 6, 0.25);
        --ctx-accent-define-text: #fcd34d; --ctx-accent-define-hover: #44403c;
        --ctx-highlight-bg: rgba(217, 119, 6, 0.15); --ctx-highlight-border: #f59e0b;
      }
      .ctx-root-container[data-theme="clean-light"] {
        --ctx-bg-primary: #ffffff; --ctx-bg-secondary: #f4f4f5; --ctx-bg-glass: rgba(255, 255, 255, 0.96);
        --ctx-bg-card: #f4f4f5; --ctx-border: #e4e4e7; --ctx-border-glow: #d4d4d8;
        --ctx-text-main: #18181b; --ctx-text-muted: #71717a; --ctx-text-subtle: #a1a1aa;
        --ctx-accent-define-bg: #f4f4f5; --ctx-accent-define-border: #e4e4e7; --ctx-accent-define-text: #18181b; --ctx-accent-define-hover: #e4e4e7;
        --ctx-highlight-bg: rgba(0, 0, 0, 0.08); --ctx-highlight-border: #71717a;
      }
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      
      .ctx-hud-toolbar {
        position: fixed; z-index: 2147483645; display: flex; align-items: center; gap: 4px; padding: 4px;
        background: var(--ctx-bg-glass); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--ctx-border); border-radius: var(--ctx-radius-pill); box-shadow: var(--ctx-shadow-hud);
        opacity: 0; transform: translateY(4px) scale(0.97); pointer-events: none; transition: opacity 0.16s ease, transform 0.16s ease; user-select: none;
      }
      .ctx-hud-toolbar.ctx-visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      .ctx-hud-btn { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; background: var(--ctx-accent-define-bg); border: 1px solid var(--ctx-accent-define-border); border-radius: var(--ctx-radius-pill); color: var(--ctx-accent-define-text); font-size: 12px; font-weight: 500; cursor: pointer; transition: var(--ctx-transition); white-space: nowrap; }
      .ctx-hud-btn:hover { background: var(--ctx-accent-define-hover); color: var(--ctx-text-main); transform: translateY(-1px); }
      .ctx-hud-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
      .ctx-hud-divider { width: 1px; height: 14px; background: var(--ctx-border); margin: 0 2px; }
      .ctx-hud-close-btn { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; border: none; background: transparent; color: var(--ctx-text-muted); cursor: pointer; transition: var(--ctx-transition); }
      .ctx-hud-close-btn:hover { background: rgba(255, 255, 255, 0.1); color: var(--ctx-text-main); }

      .ctx-popover-card {
        position: fixed; z-index: 2147483646; width: 320px; max-width: calc(100vw - 32px); background: var(--ctx-bg-glass);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--ctx-border-glow); border-radius: var(--ctx-radius); box-shadow: var(--ctx-shadow-lg); padding: 14px 16px; color: var(--ctx-text-main); opacity: 0; transform: translateY(6px) scale(0.98); pointer-events: none; transition: opacity 0.18s ease, transform 0.18s ease;
      }
      .ctx-popover-card.ctx-visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      .ctx-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
      .ctx-card-title-group { display: flex; flex-direction: column; gap: 2px; }
      .ctx-card-word { font-size: 17px; font-weight: 700; color: var(--ctx-text-main); letter-spacing: -0.01em; text-transform: capitalize; }
      .ctx-card-phonetic-row { display: flex; align-items: center; gap: 8px; margin-top: 1px; }
      .ctx-card-phonetic { font-size: 12.5px; color: var(--ctx-text-muted); font-style: italic; }
      .ctx-card-audio-btn { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--ctx-border); background: rgba(255, 255, 255, 0.06); color: var(--ctx-text-muted); cursor: pointer; transition: var(--ctx-transition); }
      .ctx-card-audio-btn:hover { background: var(--ctx-accent-define-hover); color: var(--ctx-text-main); }
      .ctx-card-audio-btn svg { width: 11px; height: 11px; }
      .ctx-card-actions { display: flex; align-items: center; gap: 4px; }
      .ctx-icon-btn { background: transparent; border: none; color: var(--ctx-text-muted); width: 24px; height: 24px; border-radius: var(--ctx-radius-sm); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--ctx-transition); }
      .ctx-icon-btn:hover { background: rgba(255, 255, 255, 0.08); color: var(--ctx-text-main); }
      .ctx-icon-btn.ctx-saved { color: #f59e0b; }
      .ctx-card-body { max-height: 220px; overflow-y: auto; padding-right: 4px; }
      .ctx-meaning-block { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--ctx-border); }
      .ctx-meaning-block:first-child { margin-top: 0; padding-top: 0; border-top: none; }
      .ctx-pos-tag { display: inline-block; padding: 1px 7px; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; background: rgba(255, 255, 255, 0.08); color: var(--ctx-text-muted); border-radius: var(--ctx-radius-pill); margin-bottom: 6px; }
      .ctx-def-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
      .ctx-def-item { font-size: 12.5px; color: var(--ctx-text-main); line-height: 1.45; position: relative; padding-left: 10px; }
      .ctx-def-item::before { content: "•"; position: absolute; left: 0; color: var(--ctx-text-muted); }
      .ctx-example { margin-top: 2px; font-size: 11.5px; color: var(--ctx-text-muted); font-style: italic; padding-left: 6px; border-left: 2px solid var(--ctx-border); }
      .ctx-synonyms-wrap { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
      .ctx-synonym-chip { font-size: 10.5px; padding: 2px 6px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--ctx-border); border-radius: 4px; color: var(--ctx-text-muted); cursor: pointer; transition: var(--ctx-transition); }
      .ctx-synonym-chip:hover { background: var(--ctx-accent-define-hover); color: var(--ctx-text-main); }
      .ctx-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--ctx-border); }
      .ctx-footer-explore-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 500; color: var(--ctx-text-muted); background: transparent; border: none; cursor: pointer; transition: var(--ctx-transition); }
      .ctx-footer-explore-btn:hover { color: var(--ctx-text-main); transform: translateX(2px); }
      .ctx-footer-clear-btn { font-size: 11px; color: var(--ctx-text-subtle); background: transparent; border: none; cursor: pointer; transition: var(--ctx-transition); }
      .ctx-footer-clear-btn:hover { color: #ef4444; }

      .ctx-sidebar-overlay {
        position: fixed; top: 0; right: 0; bottom: 0; width: 400px; max-width: 100vw; z-index: 2147483647; background: var(--ctx-bg-primary); border-left: 1px solid var(--ctx-border); box-shadow: -8px 0 24px rgba(0, 0, 0, 0.35); display: flex; flex-direction: column; transform: translateX(100%); transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1); color: var(--ctx-text-main); overflow: hidden;
      }
      .ctx-sidebar-overlay.ctx-open { transform: translateX(0); }
      .ctx-sidebar-header { padding: 14px 18px; background: var(--ctx-bg-secondary); border-bottom: 1px solid var(--ctx-border); display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .ctx-sidebar-brand { display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 14px; color: var(--ctx-text-main); }
      .ctx-sidebar-search-box { position: relative; flex: 1; max-width: 200px; }
      .ctx-sidebar-search-input { width: 100%; padding: 5px 8px 5px 26px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--ctx-border); border-radius: var(--ctx-radius-pill); color: var(--ctx-text-main); font-size: 12px; outline: none; transition: var(--ctx-transition); }
      .ctx-sidebar-search-input:focus { background: rgba(255, 255, 255, 0.1); border-color: var(--ctx-text-muted); }
      .ctx-sidebar-search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--ctx-text-subtle); pointer-events: none; }
      .ctx-sidebar-close-btn { background: transparent; border: none; color: var(--ctx-text-muted); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--ctx-transition); }
      .ctx-sidebar-close-btn:hover { background: rgba(255, 255, 255, 0.08); color: var(--ctx-text-main); }
      .ctx-sidebar-body { flex: 1; overflow-y: auto; padding: 16px 18px; }
      .ctx-summary-card { background: var(--ctx-bg-card); border: 1px solid var(--ctx-border); border-radius: var(--ctx-radius); padding: 14px; margin-bottom: 16px; }
      .ctx-summary-label { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ctx-text-muted); margin-bottom: 6px; }
      .ctx-summary-text { font-size: 13px; color: var(--ctx-text-main); line-height: 1.55; }
      .ctx-accordion-item { border: 1px solid var(--ctx-border); border-radius: var(--ctx-radius-sm); background: var(--ctx-bg-card); overflow: hidden; margin-bottom: 8px; }
      .ctx-accordion-header { padding: 10px 12px; font-weight: 500; font-size: 13px; color: var(--ctx-text-main); display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: var(--ctx-transition); }
      .ctx-accordion-header:hover { background: rgba(255, 255, 255, 0.04); }
      .ctx-accordion-body { padding: 10px 12px; border-top: 1px solid var(--ctx-border); font-size: 12.5px; color: var(--ctx-text-muted); line-height: 1.5; }
      .ctx-external-wiki-link { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 10px; margin-top: 16px; background: rgba(255, 255, 255, 0.06); border: 1px solid var(--ctx-border); border-radius: var(--ctx-radius); color: var(--ctx-text-main); font-weight: 500; font-size: 12.5px; text-decoration: none; transition: var(--ctx-transition); }
      .ctx-external-wiki-link:hover { background: rgba(255, 255, 255, 0.12); }
      
      mark.ctx-lookup-highlight { background-color: var(--ctx-highlight-bg) !important; color: inherit !important; border-bottom: 1.5px dashed var(--ctx-highlight-border) !important; border-radius: 2px !important; padding: 0 2px !important; cursor: pointer !important; transition: background-color 0.15s ease !important; display: inline !important; }
      mark.ctx-lookup-highlight:hover { background-color: rgba(255, 255, 255, 0.25) !important; }

      .ctx-skeleton { background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.04) 75%); background-size: 200% 100%; animation: ctx-shimmer 1.5s infinite; border-radius: 4px; }
      @keyframes ctx-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initShadowDOM);
  } else {
    initShadowDOM();
  }
})();
