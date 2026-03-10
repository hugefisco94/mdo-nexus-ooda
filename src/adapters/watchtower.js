/**
 * Watchtower Adapter - RSS/Threat Feed OSINT Collection
 * Clean Architecture: Adapter Layer
 *
 * Fetches public RSS feeds for threat intelligence and news monitoring.
 * OODA Mapping: OBSERVE phase (sensor role)
 * "Stop at Login": Public RSS only, no authenticated feeds, skip HTTP 401/403.
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');
const https = require('https');
const http = require('http');

/** Public RSS feeds (mirrored from watchtower Go source) */
const FEEDS = [
  { name: 'Reuters',     url: 'https://feeds.reuters.com/reuters/topNews' },
  { name: 'BBC World',   url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
  { name: 'AP News',     url: 'https://rsshub.app/apnews/topics/apf-topnews' },
  { name: 'Al Jazeera',  url: 'https://www.aljazeera.com/xml/rss/all.xml' },
  { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
];

/** Threat-level keywords for classification */
const THREAT_KEYWORDS = {
  CRITICAL: ['attack', 'war', 'missile', 'nuclear', 'terror', 'emergency', 'explosion', 'killed'],
  HIGH:     ['threat', 'conflict', 'sanctions', 'military', 'strike', 'breach', 'crisis'],
  MEDIUM:   ['warning', 'tension', 'protest', 'cyber', 'vulnerability', 'hack', 'leak'],
  LOW:      ['policy', 'regulation', 'trade', 'economy', 'election', 'diplomacy'],
};

class WatchtowerAdapter extends BaseAdapter {
  constructor(config) {
    super('watchtower', config);
    this.feeds = config.watchtower?.feeds || FEEDS;
    this.timeout = config.watchtower?.timeout || 10000;
    this.maxItems = config.watchtower?.maxItems || 50;
  }

  async probe() {
    return this._tracked(async () => {
      const test = this.feeds[0];
      const data = await this._fetchUrl(test.url);
      this.available = data.length > 0;
      return { ok: this.available, feedCount: this.feeds.length, testFeed: test.name };
    });
  }

  /**
   * Execute RSS collection across all configured feeds.
   * @param {string} prompt - Ignored for RSS collection (sensor mode)
   * @param {object} options - { feedNames, maxItems, filter }
   */
  async execute(prompt, options = {}) {
    return this._tracked(async () => {
      const targetFeeds = options.feedNames
        ? this.feeds.filter(f => options.feedNames.includes(f.name))
        : this.feeds;

      const results = await Promise.allSettled(
        targetFeeds.map(feed => this._fetchFeed(feed))
      );

      const items = [];
      const errors = [];

      for (let i = 0; i < results.length; i++) {
        if (results[i].status === 'fulfilled') {
          items.push(...results[i].value);
        } else {
          errors.push({ feed: targetFeeds[i].name, error: results[i].reason?.message });
        }
      }

      // Sort by date descending, limit
      items.sort((a, b) => new Date(b.published) - new Date(a.published));
      const limited = items.slice(0, options.maxItems || this.maxItems);

      // Threat summary
      const threatSummary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
      for (const item of limited) {
        threatSummary[item.threatLevel]++;
      }

      return {
        items: limited,
        total: items.length,
        returned: limited.length,
        threatSummary,
        feedsQueried: targetFeeds.length,
        errors: errors.length > 0 ? errors : undefined,
        collectedAt: new Date().toISOString(),
      };
    });
  }

  /** Fetch and parse a single RSS feed */
  async _fetchFeed(feed) {
    const xml = await this._fetchUrl(feed.url);
    return this._parseRss(xml, feed.name);
  }

  /** Minimal RSS XML parser (no external dependency) */
  _parseRss(xml, source) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = this._extractTag(block, 'title');
      const link = this._extractTag(block, 'link');
      const pubDate = this._extractTag(block, 'pubDate');
      const description = this._extractTag(block, 'description');

      if (title) {
        items.push({
          title,
          source,
          url: link || '',
          published: pubDate || new Date().toISOString(),
          description: (description || '').slice(0, 200),
          threatLevel: this._classifyThreat(title + ' ' + (description || '')),
          category: 'news',
        });
      }
    }
    return items;
  }

  _extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
    const m = xml.match(regex);
    return m ? m[1].trim() : '';
  }

  /** Classify threat level by keyword matching */
  _classifyThreat(text) {
    const lower = text.toLowerCase();
    for (const [level, keywords] of Object.entries(THREAT_KEYWORDS)) {
      if (keywords.some(kw => lower.includes(kw))) return level;
    }
    return 'INFO';
  }

  /** HTTP(S) fetch with timeout and "stop at login" enforcement */
  _fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.get(url, { timeout: this.timeout }, (res) => {
        // "Stop at Login": skip authenticated/forbidden content
        if (res.statusCode === 401 || res.statusCode === 403) {
          resolve(''); // skip, don't error
          return;
        }
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow one redirect
          this._fetchUrl(res.headers.location).then(resolve).catch(reject);
          return;
        }
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
  }
}

module.exports = { WatchtowerAdapter };
