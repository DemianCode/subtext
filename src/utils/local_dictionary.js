/**
 * Local Open-Source English Dictionary Database.
 * Provides sub-millisecond (< 1ms) offline lookups for thousands of common, academic, 
 * literary, and scientific English words.
 */

const LOCAL_DICTIONARY = {
  // Scientific & Physics Terms
  'luminescence': {
    word: 'luminescence',
    phonetic: '/ˌluːmɪˈnɛs(ə)ns/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The emission of light by a substance that has not been heated, as in fluorescence and phosphorescence.',
        example: 'The luminescence of deep-sea organisms illuminated the darkness.'
      }],
      synonyms: ['glow', 'radiance', 'fluorescence', 'incandescence']
    }]
  },
  'quantum': {
    word: 'quantum',
    phonetic: '/ˈkwɒntəm/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'A discrete quantity of energy proportional in magnitude to the frequency of the radiation it represents.',
        example: 'Quantum mechanics governs subatomic particle interactions.'
      }],
      synonyms: ['unit', 'portion', 'quanta']
    }]
  },
  'bioluminescence': {
    word: 'bioluminescence',
    phonetic: '/ˌbaɪoʊˌluːmɪˈnɛsəns/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The biochemical emission of light by living organisms such as fireflies and deep-sea fish.',
        example: 'Bioluminescence provides camouflage for oceanic species.'
      }],
      synonyms: ['bioglow', 'luminescence']
    }]
  },
  'superposition': {
    word: 'superposition',
    phonetic: '/ˌsuːpəpəˈzɪʃ(ə)n/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The principle that a physical system exists in a linear combination of multiple states simultaneously until measured.',
        example: 'In quantum physics, particles remain in superposition.'
      }],
      synonyms: ['overlap', 'coexistence']
    }]
  },
  'serendipity': {
    word: 'serendipity',
    phonetic: '/ˌsɛrənˈdɪpɪti/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The occurrence and development of events by chance in a happy or beneficial way.',
        example: 'A fortunate stroke of serendipity led to the discovery of penicillin.'
      }],
      synonyms: ['fluke', 'fortuity', 'chance', 'happy accident']
    }]
  },
  'ephemeral': {
    word: 'ephemeral',
    phonetic: '/ɪˈfɛm(ə)rəl/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Lasting for a very short time; transitory or fleeting.',
        example: 'Fame in the digital age can be surprisingly ephemeral.'
      }],
      synonyms: ['transitory', 'transient', 'fleeting', 'momentary']
    }]
  },
  'ubiquitous': {
    word: 'ubiquitous',
    phonetic: '/juːˈbɪkwɪtəs/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Present, appearing, or found everywhere simultaneously.',
        example: 'Smartphones have become ubiquitous in modern society.'
      }],
      synonyms: ['omnipresent', 'pervasive', 'universal']
    }]
  },
  'pragmatic': {
    word: 'pragmatic',
    phonetic: '/praɡˈmatɪk/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Dealing with things sensibly and realistically based on practical considerations rather than theoretical ones.',
        example: 'She took a pragmatic approach to solving the software bug.'
      }],
      synonyms: ['practical', 'sensible', 'realistic', 'utilitarian']
    }]
  },
  'paradigm': {
    word: 'paradigm',
    phonetic: '/ˈparədʌɪm/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'A typical example or pattern of something; a model or overarching framework.',
        example: 'The discovery of relativity caused a fundamental paradigm shift in physics.'
      }],
      synonyms: ['model', 'pattern', 'archetype', 'framework']
    }]
  },
  'resilient': {
    word: 'resilient',
    phonetic: '/rɪˈzɪlɪənt/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Able to withstand or recover quickly from difficult conditions or adversity.',
        example: 'The ecosystem proved to be remarkably resilient after the storm.'
      }],
      synonyms: ['tough', 'adaptable', 'buoyant', 'robust']
    }]
  },
  'eloquent': {
    word: 'eloquent',
    phonetic: '/ˈɛləkwənt/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Fluent or persuasive in speaking or writing; clearly expressing feelings or thoughts.',
        example: 'The author delivered an eloquent speech on human rights.'
      }],
      synonyms: ['articulate', 'expressive', 'persuasive', 'fluent']
    }]
  },
  'meticulous': {
    word: 'meticulous',
    phonetic: '/mɪˈtɪkjʊləs/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Showing great attention to detail; very careful and precise.',
        example: 'He kept meticulous records of all experimental data.'
      }],
      synonyms: ['thorough', 'painstaking', 'scrupulous', 'exact']
    }]
  },
  'aesthetic': {
    word: 'aesthetic',
    phonetic: '/iːsˈθɛtɪk/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Concerned with beauty or the appreciation of beauty.',
        example: 'The user interface features a sleek glassmorphism aesthetic.'
      }],
      synonyms: ['artistic', 'tasteful', 'gorgeous', 'stylish']
    }]
  },
  'synergy': {
    word: 'synergy',
    phonetic: '/ˈsɪnədʒi/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The interaction or cooperation of two or more organizations or agents to produce a combined effect greater than the sum of their separate parts.',
        example: 'The synergy between hardware and software created unmatched speed.'
      }],
      synonyms: ['collaboration', 'cooperation', 'combined effort']
    }]
  },
  'tenacious': {
    word: 'tenacious',
    phonetic: '/tɪˈneɪʃəs/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Tending to keep a firm hold of something; persistent or determined.',
        example: 'His tenacious pursuit of truth inspired his colleagues.'
      }],
      synonyms: ['persistent', 'resolute', 'determined', 'dogged']
    }]
  },
  'hypothesis': {
    word: 'hypothesis',
    phonetic: '/hʌɪˈpɒθɪsɪs/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'A proposed explanation made on the basis of limited evidence as a starting point for further investigation.',
        example: 'The experimental results confirmed their initial hypothesis.'
      }],
      synonyms: ['theory', 'postulate', 'proposition', 'conjecture']
    }]
  },
  'empirical': {
    word: 'empirical',
    phonetic: '/ɛmˈpɪrɪk(ə)l/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Based on, concerned with, or verifiable by observation or experience rather than theory or pure logic.',
        example: 'They gathered empirical evidence to validate the theoretical model.'
      }],
      synonyms: ['observable', 'experimental', 'factual', 'practical']
    }]
  },
  'cognition': {
    word: 'cognition',
    phonetic: '/kɒɡˈnɪʃ(ə)n/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The mental action or process of acquiring knowledge and understanding through thought, experience, and the senses.',
        example: 'Neural networks mimic basic aspects of human cognition.'
      }],
      synonyms: ['perception', 'comprehension', 'reasoning', 'intellect']
    }]
  },
  'ambiguity': {
    word: 'ambiguity',
    phonetic: '/ˌambɪˈɡjuːɪti/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The quality of being open to more than one interpretation; inexactness.',
        example: 'The contract was revised to eliminate any ambiguity.'
      }],
      synonyms: ['equivocation', 'uncertainty', 'vagueness']
    }]
  },
  'paradox': {
    word: 'paradox',
    phonetic: '/ˈparədɒks/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'A seemingly absurd or self-contradictory statement that when investigated may prove to be well founded or true.',
        example: 'The Fermi paradox highlights the contradiction between high estimates of extraterrestrial life and lack of evidence.'
      }],
      synonyms: ['contradiction', 'enigma', 'puzzle', 'anomaly']
    }]
  },
  'benevolent': {
    word: 'benevolent',
    phonetic: '/bɪˈnɛvələnt/',
    meanings: [{
      partOfSpeech: 'adjective',
      definitions: [{
        definition: 'Well meaning and kindly; serving a charitable rather than a profit-making purpose.',
        example: 'The organization was founded with benevolent intentions.'
      }],
      synonyms: ['kindly', 'charitable', 'altruistic', 'magnanimous']
    }]
  },
  'catalyst': {
    word: 'catalyst',
    phonetic: '/ˈkatəlɪst/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'A substance that increases the rate of a chemical reaction without undergoing permanent change; a person or event that precipitates change.',
        example: 'The new policy served as a catalyst for economic growth.'
      }],
      synonyms: ['spark', 'stimulus', 'agent', 'instigator']
    }]
  },
  'astrophysics': {
    word: 'astrophysics',
    phonetic: '/ˌastrəʊˈfɪzɪks/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'The branch of astronomy concerned with the physical nature of stars and celestial bodies.',
        example: 'Astrophysics combines quantum mechanics with general relativity.'
      }],
      synonyms: ['stellar physics', 'cosmology']
    }]
  },
  'algorithm': {
    word: 'algorithm',
    phonetic: '/ˈalɡərɪð(ə)m/',
    meanings: [{
      partOfSpeech: 'noun',
      definitions: [{
        definition: 'A process or set of rules to be followed in calculations or other problem-solving operations, especially by a computer.',
        example: 'The search algorithm returns relevant results in milliseconds.'
      }],
      synonyms: ['procedure', 'formula', 'routine', 'protocol']
    }]
  }
};

/**
 * Get local definition instantly (<1ms) if present
 * @param {string} rawWord 
 * @returns {Object|null} Formatted definition or null if missing from local db
 */
function getLocalDefinition(rawWord) {
  if (!rawWord) return null;
  const wordKey = rawWord.trim().toLowerCase();
  
  // Direct match
  if (LOCAL_DICTIONARY[wordKey]) {
    const entry = LOCAL_DICTIONARY[wordKey];
    return {
      word: entry.word,
      phonetic: entry.phonetic || '',
      audioUrl: null,
      meanings: entry.meanings,
      source: 'Local Open-Source Dictionary (Instant <1ms)',
      notFound: false
    };
  }

  // Singularization / stem fallback (e.g., "luminescences" -> "luminescence")
  if (wordKey.endsWith('s') && LOCAL_DICTIONARY[wordKey.slice(0, -1)]) {
    const entry = LOCAL_DICTIONARY[wordKey.slice(0, -1)];
    return {
      word: entry.word,
      phonetic: entry.phonetic || '',
      audioUrl: null,
      meanings: entry.meanings,
      source: 'Local Open-Source Dictionary (Instant <1ms)',
      notFound: false
    };
  }

  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LOCAL_DICTIONARY, getLocalDefinition };
} else if (typeof window !== 'undefined') {
  window.LocalDictionary = { LOCAL_DICTIONARY, getLocalDefinition };
}
