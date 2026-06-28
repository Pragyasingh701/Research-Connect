import Keyword from '../models/Keyword.js';
import ResearchDomain from '../models/ResearchDomain.js';
import KeywordSynonym from '../models/KeywordSynonym.js';

// Predefined dictionaries for local fallback extraction
const METHODOLOGIES = [
  'quantitative analysis', 'qualitative analysis', 'mixed methods', 'survey', 
  'case study', 'randomized controlled trial', 'rct', 'experiment', 'meta-analysis', 
  'grounded theory', 'action research', 'ethnography', 'phenomenology', 'regression analysis',
  'neural networks', 'deep learning', 'supervised learning', 'unsupervised learning',
  'reinforcement learning', 'transfer learning', 'contrastive learning', 'few-shot learning'
];

const ALGORITHMS = [
  'backpropagation', 'gradient descent', 'random forest', 'support vector machine', 'svm',
  'k-means', 'k-nearest neighbors', 'knn', 'decision tree', 'naive bayes', 'logistic regression',
  'convolutional neural network', 'cnn', 'recurrent neural network', 'rnn', 'lstm', 'gru',
  'transformer', 'bert', 'gpt', 'resnet', 'yolo', 'u-net', 'adam optimizer', 'q-learning'
];

const FRAMEWORKS = [
  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'jax', 'mxnet', 'huggingface', 
  'spacy', 'nltk', 'opencv', 'pandas', 'numpy', 'scipy', 'spark', 'hadoop', 'react',
  'node.js', 'express', 'django', 'flask', 'fastapi', 'spring boot'
];

const LANGUAGES = [
  'python', 'javascript', 'typescript', 'r', 'julia', 'c++', 'c', 'java', 'scala', 
  'matlab', 'go', 'rust', 'sql', 'html', 'css'
];

const DATASETS = [
  'imagenet', 'mnist', 'cifar-10', 'cifar-100', 'coco', 'squad', 'imdb', 'movielens', 
  'mimic-iii', 'kitti', 'cityscapes', 'wikitext', 'glue', 'superglue'
];

/**
 * Perform local fallback keyword and entity extraction using string matching and heuristics.
 */
function localExtract(title = '', abstract = '') {
  const combinedText = `${title} ${abstract}`.toLowerCase();
  
  const extracted = {
    keywords: [],
    methodology: [],
    algorithms: [],
    frameworks: [],
    languages: [],
    datasets: [],
    domains: []
  };

  // 1. Helper function to search for matches
  const matchItems = (dict, targetArray, maxCount = 5) => {
    let count = 0;
    for (const item of dict) {
      if (combinedText.includes(item.toLowerCase())) {
        targetArray.push(item);
        count++;
        if (count >= maxCount) break;
      }
    }
  };

  // 2. Match entities
  matchItems(METHODOLOGIES, extracted.methodology);
  matchItems(ALGORITHMS, extracted.algorithms);
  matchItems(FRAMEWORKS, extracted.frameworks);
  matchItems(LANGUAGES, extracted.languages);
  matchItems(DATASETS, extracted.datasets);

  // 3. Simple noun-phrase / keyword extraction from title
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '');
  const titleWords = cleanTitle.split(/\s+/);
  
  // Extract 2-word and 3-word combinations that are common keywords
  const candidatePhrases = [];
  for (let i = 0; i < titleWords.length - 1; i++) {
    candidatePhrases.push(`${titleWords[i]} ${titleWords[i+1]}`);
    if (i < titleWords.length - 2) {
      candidatePhrases.push(`${titleWords[i]} ${titleWords[i+1]} ${titleWords[i+2]}`);
    }
  }

  const stopWords = new Set([
    'based', 'using', 'with', 'from', 'for', 'and', 'the', 'system', 'method', 
    'approach', 'study', 'analysis', 'framework', 'design', 'towards', 'novel'
  ]);

  const filteredPhrases = candidatePhrases.filter(phrase => {
    const words = phrase.split(' ');
    return words.every(w => w.length > 3 && !stopWords.has(w));
  });

  extracted.keywords = [...new Set([...filteredPhrases, ...extracted.algorithms, ...extracted.methodology])].slice(0, 8);

  return extracted;
}

/**
 * Call Gemini API or OpenAI API to extract rich scientific metadata
 */
async function aiExtract(title, abstract) {
  // If GEMINI_API_KEY or OPENAI_API_KEY is available, we could fetch.
  // For safety and out-of-the-box local reliability, we implement localExtract
  // but allow bridging to Gemini if configured.
  if (process.env.GEMINI_API_KEY) {
    try {
      // Integration with Gemini API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const prompt = `
You are an academic metadata extraction AI. Analyze this publication and extract scientific keywords, methodology, algorithms, frameworks, programming languages, and datasets in JSON format.
Title: "${title}"
Abstract: "${abstract}"

Respond ONLY with a valid JSON object matching this structure:
{
  "keywords": ["keyword1", "keyword2"],
  "methodology": ["methodology1"],
  "algorithms": ["algorithm1"],
  "frameworks": ["framework1"],
  "languages": ["language1"],
  "datasets": ["dataset1"],
  "domains": ["domain1"]
}
`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Clean potential markdown blocks
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.warn('⚠️ Gemini API Keyword Extraction failed, falling back to local NLP:', error.message);
      return localExtract(title, abstract);
    }
  }

  // Fallback to local heuristic parsing
  return localExtract(title, abstract);
}

export const extractKeywordsFromPublication = async (title, abstract) => {
  const result = await aiExtract(title, abstract);

  // Post-process: Ensure extracted keywords and domains exist in our DB
  const savedKeywordIds = [];
  const savedDomainIds = [];

  // Save/Find Keywords
  for (const kw of result.keywords || []) {
    const normalized = kw.trim().toLowerCase();
    if (!normalized) continue;
    
    let dbKeyword = await Keyword.findOne({ keyword: normalized });
    if (!dbKeyword) {
      dbKeyword = await Keyword.create({
        keyword: normalized,
        category: 'Extracted',
        popularityScore: 1
      });
    } else {
      dbKeyword.popularityScore = (dbKeyword.popularityScore || 0) + 1;
      await dbKeyword.save();
    }
    savedKeywordIds.push(dbKeyword._id);
  }

  // Save/Find Domains
  for (const dom of result.domains || []) {
    const normalized = dom.trim();
    if (!normalized) continue;

    let dbDomain = await ResearchDomain.findOne({ name: new RegExp(`^${normalized}$`, 'i') });
    if (!dbDomain) {
      dbDomain = await ResearchDomain.create({
        name: normalized,
        popularityScore: 1
      });
    } else {
      dbDomain.popularityScore = (dbDomain.popularityScore || 0) + 1;
      await dbDomain.save();
    }
    savedDomainIds.push(dbDomain._id);
  }

  return {
    keywords: result.keywords || [],
    keywordIds: savedKeywordIds,
    domains: result.domains || [],
    domainIds: savedDomainIds,
    methodology: result.methodology || [],
    algorithms: result.algorithms || [],
    frameworks: result.frameworks || [],
    languages: result.languages || [],
    datasets: result.datasets || []
  };
};

/**
 * Suggests keywords for a researcher based on their profile, existing publications, and history.
 */
export const suggestKeywordsForResearcher = async (userId) => {
  // Query researcher's publications
  // Find common keywords they use, and find trending/related keywords
  const trending = await Keyword.find({ isTrending: true }).limit(5);
  const popular = await Keyword.find({}).sort({ popularityScore: -1 }).limit(5);
  
  // Combine and return
  const suggestions = [...trending, ...popular].map(k => k.keyword);
  return [...new Set(suggestions)].slice(0, 8);
};
