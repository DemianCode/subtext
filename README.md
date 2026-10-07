# Subtext — Instant Dictionary & Encyclopedia HUD

A state-of-the-art desktop browser reading companion extension built with Chrome Extension Manifest V3. Instant inline dictionary definitions, phonetic pronunciation with audio playback, persistent page annotations, and parallel encyclopedia side-panel exploration.

![Extension Architecture](https://img.shields.io/badge/Manifest-V3-indigo)
![UI Isolation](https://img.shields.io/badge/UI-Shadow%20DOM-cyan)
![Lookup Engine](https://img.shields.io/badge/Engine-Local%20%3C1ms-emerald)

---

## 🚀 Key Features

### 1. 🎯 Floating Micro-Toolbar (HUD)
- **Automatic Text Selection Detection**: Selecting text on any webpage instantly renders a clean floating micro-toolbar near the cursor.
- **Dual Action Buttons**:
  - **Define** (Shortcut: `Alt+Shift+D` or `Alt+D`): Shows instant inline popover definition card anchored to text selection.
  - **Explore Article** (Shortcut: `Alt+Shift+E` or `Alt+E`): Opens companion side-panel with structured encyclopedia reference.

### 2. ⚡ Sub-Millisecond (<1ms) Local Lookup Engine
- **Embedded Open-Source Dictionary**: Instant offline lookups for thousands of common, scientific, and academic English terms.
- **Fast-Abort Online Fallback**: 1.8s timeout for online API fetch + Wikipedia global CDN summary fallback.

### 3. 📖 Inline Definition Popover Cards & Pronunciation Audio
- Word heading, phonetics (IPA), HTML5 Audio pronunciation, part-of-speech tags, definitions, and clickable synonym chips.

### 4. 🏷️ Persistent Page Annotations & Color Customization
- Marked defined words stay highlighted on page with customizable fill & dashed underline colors (purple, amber, emerald, sky, charcoal, or custom hex color picker).

### 5. 🌐 Companion Encyclopedia Side Panel
- Parallel slide-out sidebar for Wikipedia articles, hero imagery, structured accordion sections, and on-demand topic search.

### 6. 🎨 4 Understated Appearance Themes
- **Minimal Dark** (Default Charcoal)
- **Nordic Slate** (Cool Navy)
- **Warm Sepia** (Warm Stone)
- **Clean Light** (Minimalist White)
