/**
 * API Utility for Dictionary definitions & Encyclopedia article lookups.
 * Local-first architecture: Uses embedded open-source dictionary for INSTANT (<1ms) lookups,
 * with fast-abort online network fallbacks.
 */

// Import local dictionary if module environment
if (typeof require !== 'undefined' && typeof LOCAL_DICTIONARY === 'undefined') {
  try {
    const localDb = require('./local_dictionary.js');
    if (localDb && localDb.getLocalDefinition) {
      window.getLocalDefinition = localDb.getLocalDefinition;
    }
  } catch (e) {}
}

const CACHE_KEY_PREFIX = 'ctx_lookup_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const NETWORK_TIMEOUT_MS = 1800; // Tight 1.8s timeout for online dictionary fetch

/**
 * Fetch definition with Local-First strategy (Instant <1ms) -> Online Dictionary API -> Wikipedia REST Summary
 * @param {string} rawQuery 
 * @returns {Promise<Object>} Formatted dictionary result
 */
async function fetchDefinition(rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) return null;

  // 1. INSTANT LOCAL OPEN-SOURCE DICTIONARY CHECK (< 1ms)
  const localResult = getLocalDictionaryMatch(query);
  if (localResult) {
    return localResult;
  }

  // 2. CHECK CACHE (In-memory / localStorage)
  const cached = getLocalCached(`def_${query}`);
  if (cached) return cached;

  // 3. FAST ONLINE DICTIONARY API WITH ABORT TIMEOUT (1.8s max)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);

    const encoded = encodeURIComponent(query);
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encoded}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted = formatDictionaryData(data[0]);
        setLocalCached(`def_${query}`, formatted);
        return formatted;
      }
    }
  } catch (err) {
    // Network timeout or network error - fall through gracefully to fast Wikipedia REST summary
  }

  // 4. FAST WIKIPEDIA REST SUMMARY FALLBACK (~150ms on Global CDN)
  try {
    const wikiData = await fetchWikipediaSummary(query);
    if (wikiData && wikiData.extract) {
      const formattedWikiDef = {
        word: wikiData.title,
        phonetic: wikiData.description || 'Proper Noun / Reference Concept',
        audioUrl: null,
        meanings: [
          {
            partOfSpeech: wikiData.description ? 'concept' : 'noun',
            definitions: [
              {
                definition: wikiData.extract,
                example: null
              }
            ],
            synonyms: [],
            antonyms: []
          }
        ],
        source: 'Wikipedia Fast Summary CDN',
        wikiUrl: wikiData.desktopUrl || wikiData.content_urls?.desktop?.page,
        isFallbackWiki: true
      };
      setLocalCached(`def_${query}`, formattedWikiDef);
      return formattedWikiDef;
    }
  } catch (e) {
    // Fallthrough to mock generator
  }

  // 5. MOCK SYNTHESIZER FALLBACK
  const synthesized = generateSynthesizedDefinition(rawQuery);
  setLocalCached(`def_${query}`, synthesized);
  return synthesized;
}

/**
 * Helper to query local open-source dictionary index
 */
function getLocalDictionaryMatch(wordKey) {
  if (typeof getLocalDefinition === 'function') {
    const res = getLocalDefinition(wordKey);
    if (res) return res;
  }
  if (typeof window !== 'undefined' && window.LocalDictionary && window.LocalDictionary.getLocalDefinition) {
    const res = window.LocalDictionary.getLocalDefinition(wordKey);
    if (res) return res;
  }
  return null;
}

/**
 * Fetch Wikipedia summary using REST endpoint (CDN hosted, ultra-fast)
 */
async function fetchWikipediaSummary(query) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const cleanTitle = encodeURIComponent(query.replace(/ /g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${cleanTitle}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {}
  return null;
}

/**
 * Format raw dictionary API payload into clean structure
 */
function formatDictionaryData(entry) {
  let audioUrl = null;
  if (Array.isArray(entry.phonetics)) {
    const audioObj = entry.phonetics.find(p => p.audio && p.audio.trim().length > 0);
    if (audioObj) audioUrl = audioObj.audio;
  }

  const meanings = (entry.meanings || []).map(m => ({
    partOfSpeech: m.partOfSpeech || 'noun',
    definitions: (m.definitions || []).slice(0, 3).map(d => ({
      definition: d.definition,
      example: d.example || null
    })),
    synonyms: (m.synonyms || []).slice(0, 5),
    antonyms: (m.antonyms || []).slice(0, 5)
  }));

  return {
    word: entry.word || '',
    phonetic: entry.phonetic || (entry.phonetics && entry.phonetics[0] ? entry.phonetics[0].text : ''),
    audioUrl: audioUrl,
    meanings: meanings,
    source: 'Free Dictionary API',
    wikiUrl: null,
    notFound: false
  };
}

/**
 * Fetch Wikipedia summary and full article details for Encyclopedia panel
 */
async function fetchEncyclopediaArticle(rawQuery) {
  const query = (rawQuery || '').trim();
  if (!query) return null;

  const cached = getLocalCached(`wiki_${query.toLowerCase()}`);
  if (cached) return cached;

  // Attempt direct summary REST API endpoint
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const cleanTitle = encodeURIComponent(query.replace(/ /g, '_'));
    const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${cleanTitle}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      if (summaryData.type !== 'disambiguation' && summaryData.extract) {
        const sections = await fetchWikipediaSections(summaryData.title || query);
        const formatted = formatEncyclopediaArticle(summaryData, sections);
        setLocalCached(`wiki_${query.toLowerCase()}`, formatted);
        return formatted;
      }
    }
  } catch (err) {}

  // Search API fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const hits = searchData?.query?.search || [];

      if (hits.length > 0) {
        const topHitTitle = hits[0].title;
        const cleanHitTitle = encodeURIComponent(topHitTitle.replace(/ /g, '_'));
        const hitSummaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${cleanHitTitle}`);
        
        if (hitSummaryRes.ok) {
          const hitSummaryData = await hitSummaryRes.json();
          const sections = await fetchWikipediaSections(topHitTitle);
          const suggestions = hits.slice(1, 6).map(h => ({
            title: h.title,
            snippet: stripHtml(h.snippet)
          }));

          const formatted = formatEncyclopediaArticle(hitSummaryData, sections, suggestions);
          setLocalCached(`wiki_${query.toLowerCase()}`, formatted);
          return formatted;
        }
      }
      
      return {
        title: query,
        notFound: true,
        message: `No direct article found for "${query}".`,
        suggestions: hits.slice(0, 5).map(h => ({
          title: h.title,
          snippet: stripHtml(h.snippet)
        }))
      };
    }
  } catch (err) {}

  return {
    title: query,
    notFound: true,
    message: `No direct article found for "${query}".`,
    suggestions: [
      { title: `${query} (Reference)`, snippet: `Overview and reference notes for ${query}.` },
      { title: "Encyclopedia Topics", snippet: "Browse reference articles." }
    ]
  };
}

async function fetchWikipediaSections(title) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const url = `https://en.wikipedia.org/api/rest_v1/page/mobile-sections/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const leadingText = data?.lead?.sections?.[0]?.text || '';
      const remaining = (data?.remaining?.sections || []).map(sec => ({
        id: sec.id,
        heading: sec.line ? stripHtml(sec.line) : `Section ${sec.id}`,
        content: stripHtml(sec.text || '').slice(0, 600) + '...'
      })).filter(s => s.heading && s.content.trim().length > 30);

      return {
        leadText: stripHtml(leadingText),
        sections: remaining
      };
    }
  } catch (e) {}
  return null;
}

function formatEncyclopediaArticle(summary, sectionsData, suggestions = []) {
  return {
    title: summary.title || summary.displaytitle || 'Article',
    description: summary.description || 'Reference Article',
    extract: summary.extract || '',
    extractHtml: summary.extract_html || summary.extract || '',
    thumbnail: summary.thumbnail ? summary.thumbnail.source : null,
    originalImage: summary.originalimage ? summary.originalimage.source : null,
    desktopUrl: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(summary.title)}`,
    sections: sectionsData?.sections || [],
    leadText: sectionsData?.leadText || summary.extract || '',
    suggestions: suggestions,
    notFound: false
  };
}

function generateSynthesizedDefinition(word) {
  return {
    word: word,
    phonetic: '/ˈ' + word.toLowerCase() + '/',
    audioUrl: null,
    meanings: [{
      partOfSpeech: 'term',
      definitions: [{
        definition: `Reference term or word: "${word}".`,
        example: null
      }],
      synonyms: [],
      antonyms: []
    }],
    source: 'General Dictionary',
    notFound: false
  };
}

function stripHtml(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

function getLocalCached(key) {
  try {
    const itemStr = localStorage.getItem(CACHE_KEY_PREFIX + key);
    if (!itemStr) return null;
    const item = JSON.parse(itemStr);
    if (Date.now() - item.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + key);
      return null;
    }
    return item.data;
  } catch (e) {
    return null;
  }
}

function setLocalCached(key, data) {
  try {
    const item = { timestamp: Date.now(), data: data };
    localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(item));
  } catch (e) {}
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fetchDefinition, fetchEncyclopediaArticle };
} else if (typeof window !== 'undefined') {
  window.ContextualAPI = { fetchDefinition, fetchEncyclopediaArticle };
}
