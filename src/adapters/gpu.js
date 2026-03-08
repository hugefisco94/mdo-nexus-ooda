/**
 * GPU Adapter - DO GPU MI300X vLLM Direct Access
 * Clean Architecture: Adapter Layer
 *
 * Direct HTTP calls to vLLM endpoints on DO GPU Droplet.
 * RAG Stack: Generation (30B MoE), Embedding (8B), Reranker (0.6B)
 * GPU: AMD MI300X 192GB HBM3, VRAM 134GB/206GB (65%)
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');

const GPU_MODELS = {
  'rag-gen':    { id: 'qwen3-30b-rag',    port: 8000, maxTokens: 4096, tier: 'generation', type: 'MoE', activeParams: '3B' },
  'rag-embed':  { id: 'qwen3-embed-8b',   port: 8001, maxTokens: 8192, tier: 'embedding',  type: 'dense', dimensions: 4096 },
  'rag-rerank': { id: 'qwen3-reranker',    port: 8002, maxTokens: 4096, tier: 'reranker',   type: 'dense' },
};

class GpuAdapter extends BaseAdapter {
  constructor(config) {
    super('gpu', config);
    this.host = config.gpu?.host || '129.212.185.133';
    this.apiKey = config.gpu?.apiKey || 'sk-do-vllm-2026';
    this.defaultModel = config.gpu?.defaultModel || 'rag-gen';
    this.timeout = config.gpu?.timeout || 60000;
    this.openfangPort = config.gpu?.openfangPort || 4200;
  }

  async probe() {
    return this._tracked(async () => {
      const results = await Promise.allSettled(
        Object.entries(GPU_MODELS).map(([key, m]) =>
          this._fetch(m.port, '/v1/models', 'GET', null, 5000)
            .then(r => ({ key, ok: JSON.parse(r).data?.length > 0 }))
            .catch(() => ({ key, ok: false }))
        )
      );
      const available = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
      this.availableModels = available.filter(a => a.ok).map(a => a.key);
      this.available = this.availableModels.length > 0;
      return { models: this.availableModels, count: this.availableModels.length };
    });
  }

  /**
   * Execute inference on a GPU model.
   * @param {string} prompt
   * @param {object} options - { model: '72b'|'7b'|'pixtral', system, maxTokens, temperature }
   */
  async execute(prompt, options = {}) {
    const modelKey = options.model || this.defaultModel;
    const model = GPU_MODELS[modelKey] || GPU_MODELS[this.defaultModel];

    return this._tracked(async () => {
      const body = {
        model: model.id,
        messages: [
          ...(options.system ? [{ role: 'system', content: options.system }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: Math.min(options.maxTokens || model.maxTokens, model.maxTokens),
        temperature: options.temperature ?? 0.3,
      };

      const raw = await this._fetch(model.port, '/v1/chat/completions', 'POST', body, options.timeout || this.timeout);
      const data = JSON.parse(raw);

      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      throw new Error('Unexpected GPU response format');
    });
  }

  /**
   * Fan out to all available GPU models in parallel.
   * Returns sorted by latency.
   */
  async fanOut(prompt, options = {}) {
    const models = options.models || Object.keys(GPU_MODELS);
    const tasks = models.map(key =>
      this.execute(prompt, { ...options, model: key })
        .then(r => ({ model: key, ...r }))
        .catch(e => ({ model: key, ok: false, error: e.message, latency: 0 }))
    );
    const results = await Promise.allSettled(tasks);
    return results
      .map(r => r.status === 'fulfilled' ? r.value : { ok: false, error: r.reason?.message })
      .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));
  }

  /**
   * Generate embeddings via RAG Embedding model (port 8001).
   * @param {string|string[]} input - text(s) to embed
   * @returns {Promise<number[][]>} embedding vectors (dim=4096)
   */
  async embed(input, options = {}) {
    return this._tracked(async () => {
      const body = {
        model: GPU_MODELS['rag-embed'].id,
        input: Array.isArray(input) ? input : [input],
        encoding_format: 'float',
      };
      const raw = await this._fetch(8001, '/v1/embeddings', 'POST', body, options.timeout || this.timeout);
      const data = JSON.parse(raw);
      if (data.data) return data.data.map(d => d.embedding);
      throw new Error('Embedding failed: ' + JSON.stringify(data.error || data));
    });
  }

  /**
   * Rerank documents against a query via RAG Reranker (port 8002).
   * @param {string} query
   * @param {string[]} documents
   * @returns {Promise<{index: number, score: number}[]>} sorted by score desc
   */
  async rerank(query, documents, options = {}) {
    return this._tracked(async () => {
      const results = await Promise.all(
        documents.map(async (doc, i) => {
          const body = { model: GPU_MODELS['rag-rerank'].id, text_1: query, text_2: doc };
          const raw = await this._fetch(8002, '/v1/score', 'POST', body, options.timeout || 15000);
          const data = JSON.parse(raw);
          return { index: i, score: data.data?.[0]?.score || 0, document: doc };
        })
      );
      return results.sort((a, b) => b.score - a.score);
    });
  }

  /**
   * Full RAG pipeline: embed query, rerank candidates, generate answer.
   * @param {string} query - user question
   * @param {string[]} documents - candidate documents
   * @param {object} options - { topK, system, maxTokens }
   */
  async rag(query, documents, options = {}) {
    return this._tracked(async () => {
      const ranked = await this.rerank(query, documents);
      const topK = options.topK || 3;
      const context = ranked.slice(0, topK).map((r, i) => `[${i + 1}] ${r.document}`).join('\n\n');
      const system = options.system || 'Answer based on the provided context. Cite sources using [n] notation.';
      const prompt = `Context:\n${context}\n\nQuestion: ${query}`;
      const answer = await this.execute(prompt, { model: 'rag-gen', system, maxTokens: options.maxTokens || 2048 });
      return { answer, sources: ranked.slice(0, topK), totalCandidates: documents.length };
    });
  }

  /**
   * Call openfang Agent OS to create and run an agent task.
   * @param {string} hand - 'researcher'|'collector'|'lead'|'predictor'
   * @param {string} prompt
   */
  async openfang(hand, prompt, options = {}) {
    return this._tracked(async () => {
      // Create agent
      const createRes = await this._fetchOpenfang('/api/agents', 'POST', {
        hand: hand || 'researcher',
        name: options.name || `mdo-${hand}-${Date.now()}`,
      });
      const agent = JSON.parse(createRes);
      const agentId = agent.id || agent.agent_id;

      if (!agentId) throw new Error('Failed to create openfang agent');

      // Send message
      const msgRes = await this._fetchOpenfang(`/api/agents/${agentId}/message`, 'POST', {
        content: prompt,
      }, options.timeout || 120000);

      return JSON.parse(msgRes);
    });
  }

  /**
   * Execute a task via OpenManus on the GPU.
   * Uses SSH + docker exec to run OpenManus headless.
   */
  async openmanus(prompt, options = {}) {
    return this._tracked(async () => {
      const body = {
        model: 'qwen2.5-vl-72b',
        messages: [
          { role: 'system', content: 'You are OpenManus, an AI agent that can use tools to complete tasks. Plan step by step then execute.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature ?? 0.2,
      };

      const raw = await this._fetch(8000, '/v1/chat/completions', 'POST', body, options.timeout || this.timeout);
      const data = JSON.parse(raw);
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      throw new Error('OpenManus proxy call failed');
    });
  }

  /** Get GPU model info */
  models() {
    return { ...GPU_MODELS };
  }

  /** Internal HTTP fetch to vLLM */
  async _fetch(port, path, method, body, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout || this.timeout);
    try {
      const opts = {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`http://${this.host}:${port}${path}`, opts);
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }

  /** Internal HTTP fetch to openfang */
  async _fetchOpenfang(path, method, body, timeout) {
    return this._fetch(this.openfangPort, path, method, body, timeout || 30000);
  }
}

module.exports = { GpuAdapter, GPU_MODELS };
