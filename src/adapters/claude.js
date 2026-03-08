/**
 * Claude Adapter - Anthropic Claude via OpenRouter
 * Clean Architecture: Adapter Layer
 *
 * Routes to Claude Sonnet 4.6 via OpenRouter API for strategic
 * planning and decision-making in the DECIDE phase.
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');

class ClaudeAdapter extends BaseAdapter {
  constructor(config) {
    super('claude', config);
    this.url = config.claude?.url || 'https://openrouter.ai/api/v1';
    this.apiKey = config.claude?.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.defaultModel = config.claude?.model || 'anthropic/claude-sonnet-4-6';
    this.timeout = config.claude?.timeout || 120000;
  }

  async probe() {
    return this._tracked(async () => {
      if (!this.apiKey) {
        this.available = false;
        return false;
      }
      const res = await this._fetch('/models', 'GET', null, 10000);
      this.available = res.includes('claude');
      return this.available;
    });
  }

  async execute(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    return this._tracked(async () => {
      const body = {
        model,
        messages: [
          ...(options.system ? [{ role: 'system', content: options.system }] : []),
          { role: 'user', content: prompt },
        ],
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.3,
      };
      const raw = await this._fetch('/chat/completions', 'POST', body, options.timeout || this.timeout);
      const data = JSON.parse(raw);
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      throw new Error('Unexpected Claude response format');
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
          'HTTP-Referer': 'https://mdo-command-center.local',
          'X-Title': 'MDO Command Center',
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

module.exports = { ClaudeAdapter };
