/**
 * Elice Cloud Adapter - LiteLLM Proxy (HTTP)
 * Clean Architecture: Adapter Layer
 *
 * Calls Elice Cloud LiteLLM proxy via SSH tunnel (localhost:8100)
 * Access to 85+ models via OpenRouter/Swarm routing
 * Strengths: Heavy inference, swarm parallel, free-tier models
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');

class EliceAdapter extends BaseAdapter {
  constructor(config) {
    super('elice', config);
    this.url = config.elice?.url || 'http://localhost:8100';
    this.apiKey = config.elice?.apiKey || 'sk-elice-litellm-key';
    this.defaultModel = config.elice?.defaultModel || 'swarm/gemini-flash';
    this.timeout = config.elice?.timeout || 60000;
  }

  async probe() {
    return this._tracked(async () => {
      const res = await this._fetch('/health/liveliness', 'GET', null, 5000);
      this.available = res.includes('alive');
      return this.available;
    });
  }

  async execute(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    return this._tracked(async () => {
      const body = {
        model,
        messages: [
          { role: 'system', content: options.system || 'You are a helpful AI assistant. Respond concisely.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      };
      const raw = await this._fetch('/v1/chat/completions', 'POST', body, options.timeout || this.timeout);
      const data = JSON.parse(raw);
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      throw new Error('Unexpected response format');
    });
  }

  /** List available models */
  async models() {
    return this._tracked(async () => {
      const raw = await this._fetch('/v1/models', 'GET', null, 10000);
      const data = JSON.parse(raw);
      return (data.data || []).map(m => m.id);
    });
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

module.exports = { EliceAdapter };
