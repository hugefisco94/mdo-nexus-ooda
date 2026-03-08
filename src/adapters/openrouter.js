/**
 * OpenRouter Adapter - Direct OpenRouter API for Lightweight Swarm
 * Clean Architecture: Adapter Layer
 *
 * Provides direct OpenRouter API access bypassing Elice/LiteLLM proxy.
 * Optimized for lightweight parallel inference (AI Swarm pattern).
 *
 * Tier allocation:
 *   t1_fast: gemini-3-flash, qwen3-coder, mistral-small → <5s
 *   t2_power: claude-haiku-4.5, gemini-3-pro, deepseek-v3 → 5-15s
 *   t3_deep: deepseek-r1, claude-sonnet → 15-60s
 *
 * References:
 *   - OpenRouter API: https://openrouter.ai/docs
 *   - MDO Swarm architecture: swarm.js
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');

/**
 * OpenRouter model catalog - lightweight swarm models
 * Prioritized by cost-efficiency and latency for parallel inference
 */
const OPENROUTER_MODELS = {
  // ── T1 Fast (경량 고속) ─────────────────────────
  'or/gemini-flash':     { id: 'google/gemini-2.5-flash-preview', tier: 'fast', latencyMs: 3000 },
  'or/gemini3-flash':    { id: 'google/gemini-3-flash-preview',   tier: 'fast', latencyMs: 3000 },
  'or/qwen3-coder':      { id: 'qwen/qwen3-coder',               tier: 'fast', latencyMs: 5000 },
  'or/mistral-small':    { id: 'mistralai/mistral-small-3.2-24b-instruct', tier: 'fast', latencyMs: 9000 },
  'or/minimax':          { id: 'minimax/minimax-m2.5',            tier: 'fast', latencyMs: 10000 },

  // ── T2 Power (중형 분석) ────────────────────────
  'or/claude-haiku':     { id: 'anthropic/claude-haiku-4.5',      tier: 'power', latencyMs: 5000 },
  'or/gemini-pro':       { id: 'google/gemini-3-pro-preview',     tier: 'power', latencyMs: 7000 },
  'or/deepseek-v3':      { id: 'deepseek/deepseek-chat',          tier: 'power', latencyMs: 5000 },
  'or/qwen3-235b':       { id: 'qwen/qwen3-235b-a22b',           tier: 'power', latencyMs: 14000 },

  // ── T3 Deep (심층 추론) ─────────────────────────
  'or/deepseek-r1':      { id: 'deepseek/deepseek-r1',           tier: 'deep', latencyMs: 21000 },
  'or/claude-sonnet':    { id: 'anthropic/claude-sonnet-4-6',     tier: 'deep', latencyMs: 15000 },
};

class OpenRouterAdapter extends BaseAdapter {
  constructor(config) {
    super('openrouter', config);
    this.url = 'https://openrouter.ai/api/v1';
    this.apiKey = config.openrouter?.apiKey || config.claude?.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.timeout = config.openrouter?.timeout || 60000;
    this.models = OPENROUTER_MODELS;
  }

  async probe() {
    return this._tracked(async () => {
      if (!this.apiKey) {
        this.available = false;
        return false;
      }
      const raw = await this._fetch('/models', 'GET', null, 10000);
      this.available = raw.includes('data');
      return this.available;
    });
  }

  /**
   * Execute prompt against a specific OpenRouter model
   * @param {string} prompt
   * @param {object} options - { model: 'or/gemini-flash', system, maxTokens, temperature }
   */
  async execute(prompt, options = {}) {
    const modelKey = options.model || 'or/gemini-flash';
    const modelSpec = this.models[modelKey];
    const modelId = modelSpec?.id || modelKey.replace('or/', '');

    return this._tracked(async () => {
      const body = {
        model: modelId,
        messages: [
          ...(options.system ? [{ role: 'system', content: options.system }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.3,
      };
      const raw = await this._fetch(
        '/chat/completions', 'POST', body,
        options.timeout || modelSpec?.latencyMs * 3 || this.timeout
      );
      const data = JSON.parse(raw);
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      throw new Error('Unexpected OpenRouter response');
    });
  }

  /**
   * Fan out prompt to all models in a tier
   * @param {string} prompt
   * @param {string} tier - 'fast'|'power'|'deep'|'all'
   * @param {object} options
   * @returns {Array<{model, ok, data, latency}>}
   */
  async fanOutTier(prompt, tier = 'fast', options = {}) {
    const models = tier === 'all'
      ? Object.keys(this.models)
      : Object.entries(this.models)
          .filter(([, spec]) => spec.tier === tier)
          .map(([key]) => key);

    const tasks = models.map(model =>
      this.execute(prompt, { ...options, model })
        .then(r => ({ model, ...r }))
        .catch(e => ({ model, ok: false, error: e.message, latency: 0 }))
    );

    const results = await Promise.allSettled(tasks);
    return results
      .map(r => r.status === 'fulfilled' ? r.value : { ok: false, error: r.reason?.message })
      .sort((a, b) => (a.latency || Infinity) - (b.latency || Infinity));
  }

  /** Get model list by tier */
  modelsByTier(tier) {
    if (!tier || tier === 'all') return Object.keys(this.models);
    return Object.entries(this.models)
      .filter(([, spec]) => spec.tier === tier)
      .map(([key]) => key);
  }

  /** Get tier info summary */
  tierInfo() {
    const tiers = { fast: 0, power: 0, deep: 0 };
    for (const spec of Object.values(this.models)) {
      tiers[spec.tier] = (tiers[spec.tier] || 0) + 1;
    }
    return tiers;
  }

  async _fetch(path, method, body, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const opts = {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mdo-command-center.local',
          'X-Title': 'MDO Command Center Swarm',
        },
        signal: controller.signal,
      };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${this.url}${path}`, opts);
      return await res.text();
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = { OpenRouterAdapter, OPENROUTER_MODELS };
