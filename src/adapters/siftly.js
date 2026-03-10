/**
 * Siftly Adapter - Social Media OSINT Bookmark Analysis
 * Clean Architecture: Adapter Layer
 *
 * Queries Siftly REST API (localhost) for bookmark entity extraction and tagging.
 * OODA Mapping: OBSERVE + ORIENT phases (entity extraction, semantic tagging)
 * "Stop at Login": Only processes user-exported bookmarks, no crawling.
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');
const http = require('http');

class SiftlyAdapter extends BaseAdapter {
  constructor(config) {
    super('siftly', config);
    this.host = config.siftly?.host || 'localhost';
    this.port = config.siftly?.port || 3000;
    this.timeout = config.siftly?.timeout || 10000;
  }

  async probe() {
    return this._tracked(async () => {
      try {
        const res = await this._api('/api/categories', 'GET');
        this.available = Array.isArray(res) || (res && typeof res === 'object');
        return { ok: this.available, endpoint: `${this.host}:${this.port}` };
      } catch (e) {
        this.available = false;
        return { ok: false, error: e.message };
      }
    });
  }

  /**
   * Execute bookmark analysis.
   * @param {string} prompt - Search query for bookmarks
   * @param {object} options - { action: 'search'|'categories'|'categorize'|'export', category, limit }
   */
  async execute(prompt, options = {}) {
    const action = options.action || 'search';

    return this._tracked(async () => {
      switch (action) {
        case 'search':
          return this._searchBookmarks(prompt, options);
        case 'categories':
          return this._getCategories();
        case 'categorize':
          return this._categorize();
        case 'export':
          return this._exportData();
        default:
          return this._searchBookmarks(prompt, options);
      }
    });
  }

  async _searchBookmarks(query, options) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (options.category) params.set('category', options.category);
    params.set('limit', String(options.limit || 24));
    params.set('page', '1');

    const data = await this._api(`/api/bookmarks?${params.toString()}`, 'GET');
    return {
      bookmarks: data.bookmarks || data,
      total: data.total || (Array.isArray(data) ? data.length : 0),
      query,
      source: 'siftly',
    };
  }

  async _getCategories() {
    return this._api('/api/categories', 'GET');
  }

  async _categorize() {
    return this._api('/api/categorize', 'POST', {});
  }

  async _exportData() {
    return this._api('/api/export', 'GET');
  }

  /** HTTP request to Siftly API */
  _api(path, method, body) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: this.host,
        port: this.port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
        timeout: this.timeout,
      };

      const req = http.request(opts, (res) => {
        // "Stop at Login": skip if auth required
        if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({ skipped: true, reason: 'auth_required', statusCode: res.statusCode });
          return;
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { resolve({ raw: data }); }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Siftly API timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = { SiftlyAdapter };
