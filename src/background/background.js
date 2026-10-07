/**
 * Background Service Worker for Contextual Reading & Lookup Extension.
 * Listens for extension commands, proxy API queries, manages tab messaging & storage.
 */

// Import local dictionary first, then API utility
importScripts('../utils/local_dictionary.js', '../utils/api.js');

// Lifecycle initialization
chrome.runtime.onInstalled.addListener(() => {
  console.log('[ContextualLookup] Extension installed successfully.');
  
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          enableHudOnSelection: true,
          autoHighlight: true,
          theme: 'dark',
          highlightStyle: 'wavy',
          savedWords: [],
          recentLookups: []
        }
      });
    }
  });

  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
});

// Listen for global keyboard command shortcuts (Alt+Shift+D / Alt+Shift+E)
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0 || !tabs[0].id) return;

    const activeTabId = tabs[0].id;
    if (command === 'define-selection') {
      chrome.tabs.sendMessage(activeTabId, { action: 'TRIGGER_DEFINE_SHORTCUT' }).catch(err => {
        console.warn('[ContextualLookup] Could not send command to tab:', err);
      });
    } else if (command === 'explore-selection') {
      chrome.tabs.sendMessage(activeTabId, { action: 'TRIGGER_EXPLORE_SHORTCUT' }).catch(err => {
        console.warn('[ContextualLookup] Could not send command to tab:', err);
      });
    }
  });
});

// Centralized message listener from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_DEFINITION') {
    ContextualAPI.fetchDefinition(request.query)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'FETCH_ENCYCLOPEDIA') {
    ContextualAPI.fetchEncyclopediaArticle(request.query)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'SAVE_WORD') {
    saveWordToStorage(request.wordData)
      .then(res => sendResponse({ success: true, data: res }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'RECORD_LOOKUP') {
    recordLookupHistory(request.query, request.type)
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }

  if (request.action === 'TOGGLE_SIDE_PANEL') {
    if (chrome.sidePanel && sender.tab) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
    }
    sendResponse({ success: true });
    return false;
  }
});

async function saveWordToStorage(wordObj) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['savedWords'], (result) => {
      const saved = result.savedWords || [];
      const exists = saved.some(w => w.word.toLowerCase() === wordObj.word.toLowerCase());
      
      let updated;
      if (exists) {
        updated = saved.filter(w => w.word.toLowerCase() !== wordObj.word.toLowerCase());
      } else {
        updated = [
          {
            word: wordObj.word,
            phonetic: wordObj.phonetic || '',
            definition: wordObj.meanings?.[0]?.definitions?.[0]?.definition || '',
            dateAdded: new Date().toISOString()
          },
          ...saved
        ];
      }

      chrome.storage.local.set({ savedWords: updated }, () => {
        resolve({ isSaved: !exists, savedWords: updated });
      });
    });
  });
}

async function recordLookupHistory(query, type) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['recentLookups'], (result) => {
      const history = result.recentLookups || [];
      const filtered = history.filter(item => item.query.toLowerCase() !== query.toLowerCase());
      const updated = [
        {
          query: query,
          type: type || 'definition',
          timestamp: Date.now()
        },
        ...filtered
      ].slice(0, 30);

      chrome.storage.local.set({ recentLookups: updated }, resolve);
    });
  });
}
