'use strict';

/**
 * OsintService - OSINT Collection & Analysis Orchestrator
 * Clean Architecture: Service Layer
 *
 * Coordinates 4 OSINT adapters: watchtower, siftly, daaf, deimv2
 * OODA Mapping: Feeds OBSERVE→ORIENT→DECIDE pipeline
 * "Stop at Login": All collection limited to public data only.
 */

const { createAdapters, probeAll } = require('../adapters');

class OsintService {
  constructor(config = {}) {
    this._config = config;
    this._adapters = null;
    this._cache = { feeds: null, social: null, imagery: null, analysis: null };
    this._cacheTs = {};
    this._cacheTTL = config.cacheTTL || 60000; // 1 minute default
  }

  /** Lazy-init adapters */
  _ensureAdapters() {
    if (!this._adapters) {
      this._adapters = createAdapters(this._config);
    }
    return this._adapters;
  }

  /** Get a specific adapter */
  _adapter(name) {
    const adapters = this._ensureAdapters();
    return adapters.get(name) || null;
  }

  /** Check if cache is still valid */
  _cacheValid(key) {
    const ts = this._cacheTs[key];
    return !!(ts && (Date.now() - ts) < this._cacheTTL);
  }

  /**
   * Probe all OSINT adapters for availability.
   * Returns status of watchtower, siftly, daaf, deimv2.
   */
  async probeOsint() {
    const adapters = this._ensureAdapters();
    const osintNames = ['watchtower', 'siftly', 'daaf', 'deimv2'];
    const results = {};

    await Promise.allSettled(
      osintNames.map(async (name) => {
        const adapter = adapters.get(name);
        if (!adapter) {
          results[name] = { available: false, note: 'adapter not registered' };
          return;
        }
        try {
          results[name] = await adapter.probe();
        } catch (err) {
          results[name] = { available: false, error: err.message };
        }
      })
    );

    return results;
  }

  /**
   * OBSERVE: Collect RSS/threat feeds via Watchtower.
   * @param {object} options - { maxItems, feeds }
   */
  async collectFeeds(options = {}) {
    if (this._cacheValid('feeds') && !options.force) {
      return this._cache.feeds;
    }

    const wt = this._adapter('watchtower');
    if (!wt) return { error: 'watchtower adapter not available', items: [] };

    try {
      const result = await wt.execute('collect', options);
      this._cache.feeds = result;
      this._cacheTs.feeds = Date.now();
      return result;
    } catch (err) {
      return { error: err.message, items: [] };
    }
  }

  /**
   * OBSERVE+ORIENT: Analyze social bookmarks via Siftly.
   * @param {string} query - Search query
   * @param {object} options - { action: search|categories|export }
   */
  async enrichBookmarks(query = '', options = {}) {
    if (this._cacheValid('social') && !options.force && !query) {
      return this._cache.social;
    }

    const sf = this._adapter('siftly');
    if (!sf) return { error: 'siftly adapter not available', bookmarks: [] };

    try {
      const result = await sf.execute(query, { action: 'search', ...options });
      if (!query) {
        this._cache.social = result;
        this._cacheTs.social = Date.now();
      }
      return result;
    } catch (err) {
      return { error: err.message, bookmarks: [] };
    }
  }

  /**
   * OBSERVE: Run image object detection via DEIMv2 on DO GPU.
   * @param {string} imageUrl - Public image URL
   * @param {object} options - { confidenceThreshold, maxDetections }
   */
  async analyzeImagery(imageUrl, options = {}) {
    if (!imageUrl) return { error: 'image URL required', detections: [] };

    const deim = this._adapter('deimv2');
    if (!deim) return { error: 'deimv2 adapter not available', detections: [] };

    try {
      const result = await deim.execute(imageUrl, options);
      // Cache last imagery result
      this._cache.imagery = result;
      this._cacheTs.imagery = Date.now();
      return result;
    } catch (err) {
      return { error: err.message, detections: [] };
    }
  }

  /**
   * ORIENT+DECIDE: Run structured analysis via DAAF.
   * @param {string} prompt - Analysis subject
   * @param {object} options - { method: ach|redteam|indicators|keyassumptions }
   */
  async structuredAnalysis(prompt, options = {}) {
    if (!prompt) return { error: 'analysis prompt required' };

    const daaf = this._adapter('daaf');
    if (!daaf) return { error: 'daaf adapter not available' };

    try {
      const result = await daaf.execute(prompt, options);
      this._cache.analysis = result;
      this._cacheTs.analysis = Date.now();
      return result;
    } catch (err) {
      return { error: err.message };
    }
  }

  /**
   * Aggregate all OSINT sources into unified intelligence feed.
   * Parallel collection from all available adapters.
   */
  async aggregateIntel(options = {}) {
    const startTime = Date.now();

    const [feeds, social, analysis] = await Promise.allSettled([
      this.collectFeeds(options),
      this.enrichBookmarks('', options),
      this.structuredAnalysis(options.analysisPrompt || 'general assessment', options),
    ]);

    const result = {
      timestamp: new Date().toISOString(),
      collectionDuration: Date.now() - startTime,
      feeds: feeds.status === 'fulfilled' ? feeds.value : { error: feeds.reason?.message },
      social: social.status === 'fulfilled' ? social.value : { error: social.reason?.message },
      analysis: analysis.status === 'fulfilled' ? analysis.value : { error: analysis.reason?.message },
      imagery: this._cache.imagery || null,
      summary: {
        feedCount: 0,
        threatLevels: {},
        socialCount: 0,
        analysisMethod: null,
      },
    };

    // Build summary
    if (result.feeds && result.feeds.items) {
      result.summary.feedCount = result.feeds.items.length;
      for (const item of result.feeds.items) {
        const level = item.threatLevel || 'INFO';
        result.summary.threatLevels[level] = (result.summary.threatLevels[level] || 0) + 1;
      }
    }
    if (result.social && result.social.bookmarks) {
      result.summary.socialCount = result.social.bookmarks.length;
    }
    if (result.analysis && result.analysis.method) {
      result.summary.analysisMethod = result.analysis.method;
    }

    return result;
  }

  /**
   * Dashboard data: lightweight summary for PWA polling.
   */
  dashboard() {
    return {
      cached: {
        feeds: this._cacheValid('feeds'),
        social: this._cacheValid('social'),
        imagery: this._cacheValid('imagery'),
        analysis: this._cacheValid('analysis'),
      },
      lastUpdate: {
        feeds: this._cacheTs.feeds ? new Date(this._cacheTs.feeds).toISOString() : null,
        social: this._cacheTs.social ? new Date(this._cacheTs.social).toISOString() : null,
        imagery: this._cacheTs.imagery ? new Date(this._cacheTs.imagery).toISOString() : null,
        analysis: this._cacheTs.analysis ? new Date(this._cacheTs.analysis).toISOString() : null,
      },
      feeds: this._cache.feeds || null,
      social: this._cache.social || null,
      imagery: this._cache.imagery || null,
      analysis: this._cache.analysis || null,
    };
  }

  /** Clear all cached data */
  clearCache() {
    this._cache = { feeds: null, social: null, imagery: null, analysis: null };
    this._cacheTs = {};
    return { cleared: true };
  }
}

module.exports = OsintService;
