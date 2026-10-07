# Subtext — Instant Dictionary & Encyclopedia HUD

A desktop browser reading companion extension built with Chrome Extension Manifest V3. Instant inline dictionary definitions, phonetic pronunciation with audio playback, persistent page annotations, and parallel encyclopedia side-panel exploration.

![Extension Architecture](https://img.shields.io/badge/Manifest-V3-indigo)
![UI Isolation](https://img.shields.io/badge/UI-Shadow%20DOM-cyan)
![Lookup Engine](https://img.shields.io/badge/Engine-Local%20%3C1ms-emerald)

---

## 📦 Installation & Setup

Visit the [Launch Page](https://demiancode.github.io/subtext/) to test the functionality without installation. Click 'Add to Chrome' to download the release zip.

### Option 1: Store Installation (No Developer Mode Required)
To install the extension cleanly in one click without enabling Developer Mode:
1. **Chrome Web Store / Edge Add-ons**: Publish the release zip to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/) or Microsoft Edge Partner Center. Once approved, users can install directly via the browser store.
2. **Firefox Add-ons (AMO)**: Submit the zip for signed distribution (listed or unlisted `.xpi`), allowing single-click installation without Developer Mode.

---

### Option 2: Local Development (Requires Developer Mode)
1. Clone the repository:
   ```bash
   git clone https://github.com/DemianCode/subtext.git
   ```
2. Open your browser extension management page:
   - **Chrome / Edge / Brave**: Navigate to `chrome://extensions` or `edge://extensions`
   - Enable **Developer Mode** (top-right toggle switch).
3. Click **Load unpacked** and select the repository root folder.

---

## 🛠️ Creating & Building Releases

### Local Build
To generate a standalone `.zip` distribution file locally:

```bash
npm run build
```
*(or `node scripts/build-release.js`)*

This creates `dist/subtext-v1.2.0.zip` containing all required extension assets (`manifest.json`, `src/`, `icons/`).

---

### Automated GitHub Actions Build (Online)
A GitHub Actions workflow ([`release.yml`](file:///.github/workflows/release.yml)) is configured to build the release `.zip` automatically:
1. **Manual Run (Online)**: Go to the **Actions** tab on your GitHub repository -> Select **Build & Packaging Release** -> Click **Run workflow**. Download the built `.zip` directly from **Artifacts**.
2. **Automatic Tag Release**: Pushing a git tag (e.g. `git tag v1.2.0 && git push origin v1.2.0`) automatically builds the extension and creates a new **GitHub Release** with the downloadable `.zip` attached.


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
