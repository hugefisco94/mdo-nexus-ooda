/**
 * DEIMv2 Adapter - Real-Time Object Detection (Image OSINT)
 * Clean Architecture: Adapter Layer
 *
 * Calls DEIMv2 inference API on DO GPU for object detection.
 * OODA Mapping: OBSERVE phase (imagery analysis sensor)
 * "Stop at Login": Public images only, auto-strip EXIF/geotags.
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');
const https = require('https');
const http = require('http');

class DeimV2Adapter extends BaseAdapter {
  constructor(config) {
    super('deimv2', config);
    this.host = config.deimv2?.host || '129.212.185.133';
    this.port = config.deimv2?.port || 8003;
    this.timeout = config.deimv2?.timeout || 30000;
    this.confidenceThreshold = config.deimv2?.confidenceThreshold || 0.5;
  }

  async probe() {
    return this._tracked(async () => {
      try {
        const res = await this._api('/health', 'GET');
        this.available = res && (res.status === 'ok' || res.ok);
        return { ok: this.available, endpoint: `${this.host}:${this.port}` };
      } catch {
        // DEIMv2 may not be deployed yet on GPU
        this.available = false;
        return { ok: false, note: 'DEIMv2 inference server not running (GPU deployment pending)' };
      }
    });
  }

  /**
   * Execute object detection on an image.
   * @param {string} prompt - Image URL (public only) or base64 data
   * @param {object} options - { confidenceThreshold, maxDetections, stripExif }
   */
  async execute(prompt, options = {}) {
    return this._tracked(async () => {
      // "Stop at Login": validate URL is public
      if (prompt.startsWith('http')) {
        const urlCheck = await this._checkPublicAccess(prompt);
        if (!urlCheck.public) {
          return {
            skipped: true,
            reason: 'auth_required',
            url: prompt,
            statusCode: urlCheck.statusCode,
          };
        }
      }

      const body = {
        image: prompt,
        confidence_threshold: options.confidenceThreshold || this.confidenceThreshold,
        max_detections: options.maxDetections || 100,
        strip_exif: options.stripExif !== false, // default: strip geotags
      };

      const result = await this._api('/detect', 'POST', body);

      return {
        detections: (result.detections || []).map(d => ({
          label: d.label || d.class_name,
          confidence: d.confidence || d.score,
          bbox: d.bbox || d.box,
        })),
        imageSize: result.image_size || null,
        inferenceTime: result.inference_time || null,
        model: 'DEIMv2-S',
        exifStripped: true,
        detectedAt: new Date().toISOString(),
      };
    });
  }

  /** Check if a URL is publicly accessible (no auth required) */
  async _checkPublicAccess(url) {
    return new Promise((resolve) => {
      const mod = url.startsWith('https') ? https : http;
      const req = mod.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
        resolve({
          public: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
        });
      });
      req.on('error', () => resolve({ public: false, statusCode: 0 }));
      req.on('timeout', () => { req.destroy(); resolve({ public: false, statusCode: 0 }); });
      req.end();
    });
  }

  /** HTTP request to DEIMv2 inference API */
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
        if (res.statusCode === 401 || res.statusCode === 403) {
          resolve({ skipped: true, reason: 'auth_required' });
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
      req.on('timeout', () => { req.destroy(); reject(new Error('DEIMv2 API timeout')); });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }
}

module.exports = { DeimV2Adapter };
