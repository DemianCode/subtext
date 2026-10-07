document.addEventListener('DOMContentLoaded', () => {
  const optTheme = document.getElementById('opt-theme');
  const optToggleHighlight = document.getElementById('opt-toggle-highlight');
  const optColorPicker = document.getElementById('opt-color-picker');
  const exportBtn = document.getElementById('export-json-btn');
  const clearBtn = document.getElementById('clear-cache-btn');

  let currentSettings = {
    enableHighlight: true,
    highlightColor: '#818cf8'
  };

  if (window.chrome && chrome.storage) {
    chrome.storage.local.get(['theme', 'highlightSettings'], (res) => {
      if (res.theme && optTheme) optTheme.value = res.theme;
      if (res.highlightSettings) {
        currentSettings = { ...currentSettings, ...res.highlightSettings };
        if (optToggleHighlight) optToggleHighlight.checked = currentSettings.enableHighlight;
        if (optColorPicker) optColorPicker.value = currentSettings.highlightColor;
      }
    });
  }

  if (optTheme) {
    optTheme.addEventListener('change', () => {
      const selected = optTheme.value;
      if (window.chrome && chrome.storage) {
        chrome.storage.local.set({ theme: selected });
      }
    });
  }

  if (optToggleHighlight) {
    optToggleHighlight.addEventListener('change', () => {
      currentSettings.enableHighlight = optToggleHighlight.checked;
      saveHighlightSettings(currentSettings);
    });
  }

  if (optColorPicker) {
    optColorPicker.addEventListener('input', () => {
      currentSettings.highlightColor = optColorPicker.value;
      saveHighlightSettings(currentSettings);
    });
  }

  function saveHighlightSettings(settings) {
    if (window.chrome && chrome.storage) {
      chrome.storage.local.set({ highlightSettings: settings });
    }
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (window.chrome && chrome.storage) {
        chrome.storage.local.get(['savedWords'], (res) => {
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.savedWords || [], null, 2));
          const dlAnchor = document.createElement('a');
          dlAnchor.setAttribute("href", dataStr);
          dlAnchor.setAttribute("download", "vocabulary_notes.json");
          document.body.appendChild(dlAnchor);
          dlAnchor.click();
          dlAnchor.remove();
        });
      } else {
        alert('Vocabulary export simulated.');
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (window.chrome && chrome.storage) {
        chrome.storage.local.remove(['recentLookups'], () => {
          alert('Cached lookups cleared successfully.');
        });
      } else {
        alert('Cache cleared.');
      }
    });
  }
});
