'use strict';

/**
 * DomainService - Wraps core/mdo-domains.js (extended with AGENT domain)
 * Manages multi-domain operational status, resolution, and health.
 */

const { MdoDomains, DOMAIN_DEFS, TASK_FORCES } = require('../core/mdo-domains');

class DomainService {
  constructor() {
    this._core = new MdoDomains();
  }

  /** Status of all domains */
  status() {
    return this._core.status();
  }

  /** Resolve an input string to the best-matching domain */
  resolve(input) {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    return {
      domain: this._core.resolve(text),
      adapter: this._core.adapterFor(this._core.resolve(text)),
      input: text
    };
  }

  /** Run health check across all domains */
  healthCheck() {
    const status = this._core.status();
    const results = {};
    let allHealthy = true;

    for (const [key, info] of Object.entries(status)) {
      const healthy = info.status === 'active';
      if (!healthy) allHealthy = false;
      results[key] = {
        ...info,
        healthy,
        label: DOMAIN_DEFS[key]?.label || key
      };
    }

    return { domains: results, allHealthy, checkedAt: Date.now() };
  }

  /** Load/activate a specific domain (reset its load counter) */
  load(domain) {
    const key = domain.toLowerCase();
    if (!DOMAIN_DEFS[key]) {
      return { error: `Unknown domain: ${domain}. Available: ${Object.keys(DOMAIN_DEFS).join(', ')}` };
    }
    return { domain: key, status: 'loaded', label: DOMAIN_DEFS[key].label, ts: Date.now() };
  }

  /** Get a named task force */
  taskForce(name) {
    return this._core.taskForce(name);
  }

  /** List all task forces */
  taskForces() {
    return this._core.taskForces();
  }

  /** Get synergy map */
  synergies() {
    return this._core.synergies();
  }

  /** Get recommended adapter for a domain */
  adapterFor(domain) {
    return this._core.adapterFor(domain);
  }

  /** Get agent domain capabilities */
  agentCapabilities() {
    return this._core.agentCapabilities();
  }
}

module.exports = DomainService;
