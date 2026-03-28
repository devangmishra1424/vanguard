import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────
export interface RAGDocument {
  id: number;
  content: string;
  embedding?: number[];
  metadata: {
    source?: string;
    category?: string;
    test_name?: string;
    condition?: string;
    [key: string]: any;
  };
  score?: number;
}

export interface RAGSearchResult {
  documents: RAGDocument[];
  query: string;
  model: string;
}

// ─── Global Config ────────────────────────────────────────────────────────────
const HF_TOKEN = process.env.HF_TOKEN || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const HF_DATASET = process.env.HF_DATASET || 'CaffeinatedCoding/reportraahat-indexes';
const HF_MODEL = process.env.HF_MODEL || 'CaffeinatedCoding/reportraahat-simplifier';
// BUG 2 FIX: HF flan-t5 endpoint returns 410 Gone — skip Stage 1 entirely
const SKIP_HF_STAGE1 = true;  // Endpoint deprecated, goes straight to Groq
let stage1Dead = false;  // Flip to true on first 410 — stops retrying for session
let faissIndex: any = null;
let documents: RAGDocument[] = [];
let isInitialized = false;
const embeddingCache = new Map<string, number[]>();

// ─── Load FAISS Index from HF Dataset ──────────────────────────────────────
const loadFAISSFromHF = async () => {
  if (faissIndex && documents.length > 0) return;

  const isServerless = process.env.VERCEL === '1' || process.env.LAMBDA_TASK_ROOT || !process.env.HOME;

  try {
    // Only attempt filesystem cache in development (not serverless)
    if (!isServerless) {
      const cacheDir = path.join(process.cwd(), '.rag-cache');
      const indexPath = path.join(cacheDir, 'faiss_index.json');
      const docsPath = path.join(cacheDir, 'documents.json');

      try {
        if (fs.existsSync(indexPath) && fs.existsSync(docsPath)) {
          console.log('📦 Loading FAISS index from cache...');
          faissIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
          documents = JSON.parse(fs.readFileSync(docsPath, 'utf-8'));
          console.log(`✅ Loaded ${documents.length} documents from cache`);
          return;
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache read failed, skipping:', (cacheError as Error).message);
      }
    }

    // Try downloading from HF dataset
    if (!HF_TOKEN) {
      console.warn('⚠️ HF_TOKEN not set. Using fallback knowledge base.');
      documents = getFallbackKnowledgeBase();
      faissIndex = buildFallbackIndex(documents);
      return;
    }

    console.log(`🔄 Attempting to download from ${HF_DATASET}...`);
    const response = await fetch(
      `https://huggingface.co/datasets/${HF_DATASET}/resolve/main/index.json`,
      { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
    );

    if (!response.ok) {
      console.warn(`⚠️ Failed to download from HF (${response.status}), using fallback`);
      documents = getFallbackKnowledgeBase();
      faissIndex = buildFallbackIndex(documents);
      return;
    }

    const data = await response.json();
    faissIndex = data.faiss_index || {};
    documents = data.documents || [];

    // Cache for next run (only in development)
    if (!isServerless) {
      try {
        const cacheDir = path.join(process.cwd(), '.rag-cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        fs.writeFileSync(path.join(cacheDir, 'faiss_index.json'), JSON.stringify(faissIndex));
        fs.writeFileSync(path.join(cacheDir, 'documents.json'), JSON.stringify(documents));
      } catch (writeError) {
        console.warn('⚠️ Cache write failed (expected in serverless):', (writeError as Error).message);
      }
    }

    console.log(`✅ Loaded ${documents.length} documents from HF dataset`);
  } catch (error) {
    console.warn('⚠️ Failed to load FAISS index:', (error as Error).message);
    documents = getFallbackKnowledgeBase();
    faissIndex = buildFallbackIndex(documents);
  }
};

// ─── Fallback Knowledge Base ──────────────────────────────────────────────────
const getFallbackKnowledgeBase = (): RAGDocument[] => {
  return [
    {
      id: 1,
      content: 'HbA1c measures average blood glucose over 3 months. Normal <5.7%, prediabetes 5.7-6.4%, diabetes ≥6.5%. Management: diet, exercise, lifestyle changes.',
      metadata: { test_name: 'HbA1c', category: 'diabetes', source: 'fallback' }
    },
    {
      id: 2,
      content: 'Creatinine measures kidney function. Normal females 0.50-1.10 mg/dL, males 0.70-1.20 mg/dL. Elevated indicates kidney disease. Always reference eGFR.',
      metadata: { test_name: 'Creatinine', category: 'kidney', source: 'fallback' }
    },
    {
      id: 3,
      content: 'eGFR measures kidney function. Normal >60 mL/min/1.73m². Stages: 60-89 mild, 45-59 moderate, 30-44 severe, <30 very severe.',
      metadata: { test_name: 'eGFR', category: 'kidney', source: 'fallback' }
    },
    {
      id: 4,
      content: 'Diet for diabetes: low glycemic index carbs, lean proteins, fiber. Include whole grains, vegetables, fruits, legumes. Avoid sugary drinks, white bread, fried foods.',
      metadata: { category: 'diet', condition: 'diabetes', source: 'fallback' }
    },
    {
      id: 5,
      content: 'Exercise for diabetes: 150 min moderate aerobic/week (walking, cycling) + 2-3 resistance training. Improves insulin sensitivity. Monitor blood glucose.',
      metadata: { category: 'exercise', condition: 'diabetes', source: 'fallback' }
    },
  ];
};

// ─── Build Fallback FAISS Index ───────────────────────────────────────────────
const buildFallbackIndex = (docs: RAGDocument[]): any => {
  return {
    nlist: 8,
    d: 384,
    docs: docs.map((d) => ({ id: d.id, content: d.content })),
  };
};

// ─── Cosine Similarity ────────────────────────────────────────────────────────
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
};

// ─── STAGE 1: HF flan-t5 Query Processing ────────────────────────────────────
const queryHFModel = async (text: string): Promise<string> => {
  // BUG 2 FIX: If Stage 1 is dead (410), skip immediately
  if (stage1Dead) return text;

  if (!HF_TOKEN) {
    console.warn('⚠️ HF_TOKEN not set, skipping flan-t5 processing');
    return text;
  }

  try {
    console.log(`🔄 Stage 1 (HF flan-t5): Processing input...`);
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: 'POST',
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) {
      // CRITICAL: Detect dead endpoint (410/404) and mark for all remaining findings
      if (response.status === 410 || response.status === 404) {
        stage1Dead = true;
        console.warn(`⚠️ Stage 1 endpoint dead (${response.status}). Skipping for all remaining findings.`);
        return text;
      }
      throw new Error(`HF API ${response.status}`);
    }

    const result = await response.json();
    const processed = result[0]?.generated_text || text;
    console.log(`✅ Stage 1 output: "${processed.substring(0, 80)}..."`);
    return processed;
  } catch (error) {
    console.warn('⚠️ HF flan-t5 query failed:', (error as Error).message);
    return text;
  }
};

// ─── HF Embeddings API ────────────────────────────────────────────────────────
const getHFEmbedding = async (text: string): Promise<number[]> => {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  if (!HF_TOKEN) {
    const emb = fallbackEmbedding(text);
    embeddingCache.set(text, emb);
    return emb;
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: 'POST',
        body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
      }
    );

    if (!response.ok) throw new Error(`HF API ${response.status}`);

    const embedding = await response.json();
    if (Array.isArray(embedding) && embedding[0]) {
      const result = Array.from(embedding[0] as Iterable<number>);
      embeddingCache.set(text, result);
      return result;
    }
    throw new Error('Invalid embedding response');
  } catch (error) {
    const emb = fallbackEmbedding(text);
    embeddingCache.set(text, emb);
    return emb;
  }
};

// ─── Fallback Embedding ───────────────────────────────────────────────────────
const fallbackEmbedding = (text: string): number[] => {
  const dim = 384;
  const vec = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += Math.sin((text.charCodeAt(i) * (i + 1)) / 100);
  }
  let norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  return vec.map((x) => (norm > 0 ? x / norm : x));
};

// ─── STAGE 2: FAISS Search ────────────────────────────────────────────────────
export const searchFAISS = async (
  query: string,
  topK: number = 5,
  threshold: number = 0.3
): Promise<RAGSearchResult> => {
  try {
    if (!isInitialized) await initializeRAG();

    // Stage 1: Process through HF flan-t5
    const processedQuery = await queryHFModel(`Summarize this query for medical search: ${query}`);

    // Stage 2: Get embedding and search FAISS
    console.log(`🔄 Stage 2 (FAISS): Searching index...`);
    const queryEmbedding = await getHFEmbedding(processedQuery);

    const scored = await Promise.all(
      documents.map(async (doc) => {
        const docEmbedding = doc.embedding || (await getHFEmbedding(doc.content));
        const score = cosineSimilarity(queryEmbedding, docEmbedding);
        return { ...doc, score };
      })
    );

    const results = scored
      .filter((doc) => doc.score! >= threshold)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK)
      .map(({ score, ...doc }) => ({ ...doc, score }));

    console.log(`✅ Stage 2: Retrieved ${results.length} documents`);

    return {
      documents: results,
      query: processedQuery,
      model: `${HF_MODEL} + FAISS`,
    };
  } catch (error) {
    console.error('❌ FAISS search error:', error);
    return { documents: [], query, model: 'error' };
  }
};

// ─── STAGE 3: Groq Generation with RAG Context ────────────────────────────────
export const generateWithGroq = async (
  query: string,
  systemPrompt: string,
  faissContext?: string
): Promise<string> => {
  try {
    if (!GROQ_API_KEY) {
      console.warn('⚠️ GROQ_API_KEY not set, returning mock response');
      return 'Unable to generate response without Groq API key.';
    }

    const context = faissContext || formatRAGContext(await searchFAISS(query, 5, 0.2));

    const augmentedPrompt = `
${systemPrompt}

RETRIEVED MEDICAL KNOWLEDGE FROM FAISS:
${context}

USER QUERY:
${query}

Provide a comprehensive, evidence-based response.
`;

    console.log(`🔄 Stage 3 (Groq): Generating response...`);

    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: augmentedPrompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const result = response.choices[0]?.message?.content || 'No response generated';
    console.log(`✅ Stage 3: Response generated`);
    return result;
  } catch (error) {
    console.error('❌ Groq generation error:', error);
    return 'Unable to generate response.';
  }
};

// ─── Full Three-Stage Pipeline ────────────────────────────────────────────────
export const executeFullPipeline = async (
  userQuery: string,
  systemPrompt: string,
  contextType: 'report' | 'diet' | 'exercise' | 'chat' = 'chat'
): Promise<{ processed: string; ragContext: string; generated: string }> => {
  try {
    // SIMPLIFIED: Skip RAG entirely (HF flan-t5 is 410 Gone, FAISS returns 0 results)
    // Call Groq directly for faster, more reliable responses
    console.log(`🚀 Calling Groq directly (RAG disabled): ${contextType}`);
    const generated = await generateWithGroq(userQuery, systemPrompt, '');

    return { processed: userQuery, ragContext: '', generated };
  } catch (error) {
    console.error('❌ Pipeline error:', error);
    return { processed: userQuery, ragContext: '', generated: 'Failed to generate response.' };
  }
};

// ─── Utility Functions ────────────────────────────────────────────────────────
export const formatRAGContext = (results: RAGSearchResult): string => {
  if (results.documents.length === 0) {
    return 'No relevant medical knowledge found.';
  }

  const formatted = results.documents
    .map((doc, idx) => {
      const source = doc.metadata?.source || 'kb';
      const score = doc.score ? `[${(doc.score * 100).toFixed(0)}%]` : '';
      return `[${idx + 1}] ${doc.content} ${score}`;
    })
    .join('\n\n');

  return `FAISS RETRIEVED KNOWLEDGE (${results.documents.length} docs):\n${formatted}`;
};

export const searchTestKnowledge = async (testName: string): Promise<RAGDocument[]> => {
  const result = await searchFAISS(`${testName} normal range interpretation`, 5, 0.2);
  return result.documents;
};

export const searchDietRecommendations = async (condition: string): Promise<RAGDocument[]> => {
  const result = await searchFAISS(`diet recommendations for ${condition}`, 5, 0.2);
  return result.documents;
};

export const searchExerciseRecommendations = async (condition: string): Promise<RAGDocument[]> => {
  const result = await searchFAISS(`exercise recommendations for ${condition} safety`, 5, 0.2);
  return result.documents;
};

// ─── Legacy RAG Functions (for backward compatibility) ──────────────────────
export const searchRAG = searchFAISS;
export const generateRAGResponse = async (query: string, systemPrompt: string): Promise<string> => {
  return generateWithGroq(query, systemPrompt);
};

// ─── Initialize RAG System ────────────────────────────────────────────────────
export const initializeRAG = async (): Promise<void> => {
  if (isInitialized) return;

  console.log('🚀 Initializing Three-Stage RAG Pipeline...');
  console.log(`   Stage 1 (HF flan-t5): ${HF_MODEL}`);
  console.log(`   Stage 2 (FAISS): ${HF_DATASET}`);
  console.log(`   Stage 3 (Groq): llama-3.3-70b-versatile`);

  await loadFAISSFromHF();

  console.log(`   📊 Knowledge Base: ${documents.length} documents in FAISS`);
  console.log(`   🔍 HF API: ${HF_TOKEN ? '✅' : '⚠️ (fallback)'}`);
  console.log(`   🤖 Groq API: ${GROQ_API_KEY ? '✅' : '⚠️'}`);

  isInitialized = true;
  console.log('✅ Three-Stage Pipeline Ready (HF flan-t5 → FAISS → Groq)');
};
