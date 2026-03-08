/**
 * Base Adapter - Abstract interface for AI model adapters
 * Clean Architecture: Adapter Layer (port definition)
 */
'use strict';

class BaseAdapter {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.available = false;
    this.lastLatency = 0;
    this.callCount = 0;
    this.errorCount = 0;
  }

  /** Check if the adapter's tool is available */
  async probe() {
    this.available = false;
    return false;
  }

  /** Execute a prompt and return result */
  async execute(prompt, options = {}) {
    throw new Error(`${this.name}.execute() not implemented`);
  }

  /** Get adapter status */
  status() {
    return {
      name: this.name,
      available: this.available,
      calls: this.callCount,
      errors: this.errorCount,
      lastLatency: this.lastLatency,
    };
  }

  /** Wrap execution with timing and error tracking */
  async _tracked(fn) {
    this.callCount++;
    const start = Date.now();
    try {
      const result = await fn();
      this.lastLatency = Date.now() - start;
      return { ok: true, data: result, latency: this.lastLatency, adapter: this.name };
    } catch (err) {
      this.errorCount++;
      this.lastLatency = Date.now() - start;
      return { ok: false, error: err.message, latency: this.lastLatency, adapter: this.name };
    }
  }
}

module.exports = { BaseAdapter };
