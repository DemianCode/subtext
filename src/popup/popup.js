/**
 * Popup Logic for Extension Toolbar Icon
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSearch();
  initThemeSelector();
  initHighlightSettings();
  loadRecentLookups();
  loadSavedWords();
  initSettings();
});

// Tab Switcher
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${tabId}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// Quick Search
function initSearch() {
  const searchInput = document.getElementById('quick-search-input');
  const defineBtn = document.getElementById('search-define-btn');
  const exploreBtn = document.getElementById('search-explore-btn');

  function triggerSearch(type) {
    const query = searchInput.value.trim();
    if (!query) return;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) return;
      const tabId = tabs[0].id;

      if (type === 'define') {
        chrome.tabs.sendMessage(tabId, { action: 'TRIGGER_DEFINE_SHORTCUT', query: query }).catch(() => {});
      } else {
        chrome.tabs.sendMessage(tabId, { action: 'TRIGGER_EXPLORE_SHORTCUT', query: query }).catch(() => {});
      }
    });
  }

  defineBtn.addEventListener('click', () => triggerSearch('define'));
  exploreBtn.addEventListener('click', () => triggerSearch('explore'));

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      triggerSearch('define');
    }
  });
}

// Theme Selector
function initThemeSelector() {
  const themeSelect = document.getElementById('theme-select');
  if (!themeSelect) return;

  if (window.chrome && chrome.storage) {
    chrome.storage.local.get(['theme'], (res) => {
      if (res.theme) {
        themeSelect.value = res.theme;
      }
    });
  }

  themeSelect.addEventListener('change', () => {
    const newTheme = themeSelect.value;

    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ theme: newTheme });

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'SET_THEME', theme: newTheme }).catch(() => {});
        }
      });
    }
  });
}

// Highlight Toggle & Color Picker Settings
function initHighlightSettings() {
  const toggleHighlight = document.getElementById('toggle-highlight');
  const colorSwatches = document.querySelectorAll('.color-swatch');
  const customColorInput = document.getElementById('custom-color-input');
  const colorPickerSection = document.getElementById('color-picker-section');

  let currentSettings = {
    enableHighlight: true,
    highlightColor: '#818cf8'
  };

  if (window.chrome && chrome.storage) {
    chrome.storage.local.get(['highlightSettings'], (res) => {
      if (res.highlightSettings) {
        currentSettings = { ...currentSettings, ...res.highlightSettings };
        if (toggleHighlight) toggleHighlight.checked = currentSettings.enableHighlight;
        if (customColorInput) customColorInput.value = currentSettings.highlightColor;
        updateActiveSwatch(currentSettings.highlightColor);
        if (colorPickerSection) {
          colorPickerSection.style.display = currentSettings.enableHighlight ? 'flex' : 'none';
        }
      }
    });
  }

  if (toggleHighlight) {
    toggleHighlight.addEventListener('change', () => {
      currentSettings.enableHighlight = toggleHighlight.checked;
      if (colorPickerSection) {
        colorPickerSection.style.display = currentSettings.enableHighlight ? 'flex' : 'none';
      }
      saveAndBroadcastHighlightSettings(currentSettings);
    });
  }

  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const selectedColor = swatch.getAttribute('data-color');
      currentSettings.highlightColor = selectedColor;
      if (customColorInput) customColorInput.value = selectedColor;
      updateActiveSwatch(selectedColor);
      saveAndBroadcastHighlightSettings(currentSettings);
    });
  });

  if (customColorInput) {
    customColorInput.addEventListener('input', () => {
      const selectedColor = customColorInput.value;
      currentSettings.highlightColor = selectedColor;
      updateActiveSwatch(selectedColor);
      saveAndBroadcastHighlightSettings(currentSettings);
    });
  }

  function updateActiveSwatch(colorHex) {
    colorSwatches.forEach(s => {
      if (s.getAttribute('data-color').toLowerCase() === colorHex.toLowerCase()) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }
}

function saveAndBroadcastHighlightSettings(settings) {
  if (window.chrome && chrome.storage) {
    chrome.storage.local.set({ highlightSettings: settings });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'UPDATE_HIGHLIGHT_SETTINGS',
          settings: settings
        }).catch(() => {});
      }
    });
  }
}

// Load Recent Lookups
function loadRecentLookups() {
  const recentListEl = document.getElementById('recent-list');
  if (!recentListEl) return;

  if (window.chrome && chrome.storage) {
    chrome.storage.local.get(['recentLookups'], (res) => {
      const items = res.recentLookups || [];
      renderRecentItems(recentListEl, items);
    });
  } else {
    renderRecentItems(recentListEl, [
      { query: 'luminescence', type: 'definition', timestamp: Date.now() - 3600000 },
      { query: 'Quantum Mechanics', type: 'encyclopedia', timestamp: Date.now() - 7200000 },
      { query: 'serendipity', type: 'definition', timestamp: Date.now() - 86400000 }
    ]);
  }
}

function renderRecentItems(container, items) {
  if (items.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: #71717a;">No recent lookups</div>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="list-item-card" data-query="${escapeHtml(item.query)}" data-type="${item.type}">
      <div class="item-text-group">
        <span class="item-word">${escapeHtml(item.query)}</span>
        <span class="item-sub">${formatTime(item.timestamp)}</span>
      </div>
      <span class="item-type-badge">
        ${item.type === 'definition' ? 'Define' : 'Explore'}
      </span>
    </div>
  `).join('');

  container.querySelectorAll('.list-item-card').forEach(card => {
    card.addEventListener('click', () => {
      const query = card.getAttribute('data-query');
      const type = card.getAttribute('data-type');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          const action = type === 'definition' ? 'TRIGGER_DEFINE_SHORTCUT' : 'TRIGGER_EXPLORE_SHORTCUT';
          chrome.tabs.sendMessage(tabs[0].id, { action, query }).catch(() => {});
        }
      });
    });
  });
}

// Load Saved Words
function loadSavedWords() {
  const savedListEl = document.getElementById('saved-list');
  if (!savedListEl) return;

  if (window.chrome && chrome.storage) {
    chrome.storage.local.get(['savedWords'], (res) => {
      const words = res.savedWords || [];
      renderSavedItems(savedListEl, words);
    });
  } else {
    renderSavedItems(savedListEl, [
      { word: 'ephemeral', phonetic: '/ɪˈfɛm(ə)rəl/', definition: 'Lasting for a very short time.' },
      { word: 'luminescence', phonetic: '/ˌluːmɪˈnɛs(ə)ns/', definition: 'Emission of light without high temperature.' }
    ]);
  }
}

function renderSavedItems(container, words) {
  if (words.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 20px; color: #71717a;">No saved words</div>`;
    return;
  }

  container.innerHTML = words.map(w => `
    <div class="list-item-card" data-word="${escapeHtml(w.word)}">
      <div class="item-text-group">
        <span class="item-word">${escapeHtml(w.word)} <span style="font-size:11px; color:#a1a1aa; font-style:italic;">${escapeHtml(w.phonetic || '')}</span></span>
        <span class="item-sub" style="display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(w.definition || '')}</span>
      </div>
    </div>
  `).join('');
}

function initSettings() {
  const clearBtn = document.getElementById('clear-annotations-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'CLEAR_PAGE_ANNOTATIONS' }).catch(() => {});
        }
      });
    });
  }
}

function formatTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
