document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('sp-search-input');
  const clearBtn = document.getElementById('sp-clear-btn');
  const btnDefine = document.getElementById('sp-btn-define');
  const btnExplore = document.getElementById('sp-btn-explore');
  const welcomeState = document.getElementById('sp-welcome-state');
  const resultState = document.getElementById('sp-result-state');
  const resultContent = document.getElementById('sp-result-content');
  const recentListEl = document.getElementById('sp-recent-list');

  let activeMode = 'define'; // 'define' | 'explore'

  // Input listeners
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value ? 'block' : 'none';
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    showWelcomeState();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) performLookup(q, activeMode);
    }
  });

  btnDefine.addEventListener('click', () => {
    activeMode = 'define';
    btnDefine.classList.add('active');
    btnExplore.classList.remove('active');
    const q = searchInput.value.trim();
    if (q) performLookup(q, 'define');
  });

  btnExplore.addEventListener('click', () => {
    activeMode = 'explore';
    btnExplore.classList.add('active');
    btnDefine.classList.remove('active');
    const q = searchInput.value.trim();
    if (q) performLookup(q, 'explore');
  });

  // Load history
  loadRecentHistory();

  async function performLookup(query, mode) {
    welcomeState.classList.remove('active');
    resultState.classList.add('active');
    resultContent.innerHTML = `<div style="text-align:center; padding:20px; color:var(--sp-text-muted);">Searching...</div>`;

    if (mode === 'define') {
      const data = await ContextualAPI.fetchDefinition(query);
      renderDefinition(data);
    } else {
      const data = await ContextualAPI.fetchEncyclopediaArticle(query);
      renderEncyclopedia(data);
    }

    saveLookup(query, mode);
  }

  function renderDefinition(data) {
    if (!data || data.notFound) {
      resultContent.innerHTML = `
        <div class="sp-word-title">${escapeHtml(data?.word || 'Not Found')}</div>
        <p style="color: var(--sp-text-muted); margin-top: 8px;">${escapeHtml(data?.message || 'No definition found for this term.')}</p>
      `;
      return;
    }

    const meaningsHtml = (data.meanings || []).map(m => `
      <div class="sp-meaning-block">
        <span class="sp-pos-badge">${escapeHtml(m.partOfSpeech)}</span>
        <ol class="sp-def-list">
          ${(m.definitions || []).map(d => `<li class="sp-def-item">${escapeHtml(d.definition)}</li>`).join('')}
        </ol>
      </div>
    `).join('');

    resultContent.innerHTML = `
      <div class="sp-word-header">
        <div>
          <div class="sp-word-title">${escapeHtml(data.word)}</div>
          <div class="sp-phonetic">${escapeHtml(data.phonetic || '')}</div>
        </div>
      </div>
      ${meaningsHtml}
    `;
  }

  function renderEncyclopedia(data) {
    if (!data || data.notFound) {
      resultContent.innerHTML = `
        <div class="sp-word-title">${escapeHtml(data?.query || 'Article Not Found')}</div>
        <p style="color: var(--sp-text-muted); margin-top: 8px;">${escapeHtml(data?.message || 'No encyclopedia entry found.')}</p>
      `;
      return;
    }

    resultContent.innerHTML = `
      <div class="sp-word-title">${escapeHtml(data.title)}</div>
      <p style="font-size: 12px; color: var(--sp-text-muted); margin: 4px 0 12px 0;">${escapeHtml(data.description || '')}</p>
      <div class="sp-wiki-summary">${escapeHtml(data.extract)}</div>
      ${data.desktopUrl ? `
        <a class="sp-wiki-link" href="${escapeHtml(data.desktopUrl)}" target="_blank">
          Open Full Wikipedia Article →
        </a>
      ` : ''}
    `;
  }

  function showWelcomeState() {
    resultState.classList.remove('active');
    welcomeState.classList.add('active');
    loadRecentHistory();
  }

  function loadRecentHistory() {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(['recentLookups'], (res) => {
        const history = res.recentLookups || [];
        if (history.length === 0) {
          recentListEl.innerHTML = `<div class="sp-empty-history">No recent searches yet.</div>`;
          return;
        }

        recentListEl.innerHTML = history.slice(0, 10).map(item => `
          <div class="sp-history-item" data-query="${escapeHtml(item.query)}" data-type="${escapeHtml(item.type)}">
            <span class="sp-history-word">${escapeHtml(item.query)}</span>
            <span class="sp-history-type">${escapeHtml(item.type)}</span>
          </div>
        `).join('');

        recentListEl.querySelectorAll('.sp-history-item').forEach(el => {
          el.addEventListener('click', () => {
            const q = el.getAttribute('data-query');
            const type = el.getAttribute('data-type');
            searchInput.value = q;
            clearBtn.style.display = 'block';
            activeMode = type === 'encyclopedia' ? 'explore' : 'define';
            if (activeMode === 'explore') {
              btnExplore.classList.add('active');
              btnDefine.classList.remove('active');
            } else {
              btnDefine.classList.add('active');
              btnExplore.classList.remove('active');
            }
            performLookup(q, activeMode);
          });
        });
      });
    }
  }

  function saveLookup(query, type) {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.get(['recentLookups'], (res) => {
        const history = res.recentLookups || [];
        const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
        const updated = [{ query, type: type === 'explore' ? 'encyclopedia' : 'definition', timestamp: Date.now() }, ...filtered].slice(0, 30);
        chrome.storage.local.set({ recentLookups: updated });
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
