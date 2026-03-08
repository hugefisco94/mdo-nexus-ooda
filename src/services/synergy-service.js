'use strict';

/**
 * SynergyService - Wraps core/synergy-matrix.js
 * Manages cross-domain synergy interactions and amplification tracking.
 */

const { SynergyMatrix, DOMAINS } = require('../core/synergy-matrix');

class SynergyService {
  constructor(initial) {
    this._matrix = new SynergyMatrix(initial);
  }

  /** Get the full 6x6 synergy weight matrix */
  matrix() {
    return this._matrix.get();
  }

  /** Get strength between two specific domains */
  strength(from, to) {
    try {
      return this._matrix.strength(from, to);
    } catch (e) {
      return { error: e.message };
    }
  }

  /**
   * Fire a synergy event between two domains
   * @param {string} from - Source domain (INTEL, CYBER, CODE, INFRA, DATA, AGENT)
   * @param {string} to - Target domain
   * @param {string|object} event - Event type string or payload
   */
  fire(from, to, event) {
    const eventStr = typeof event === 'object' ? (event.type || 'synergy') : (event || 'synergy');
    return this._matrix.fire(from, to, eventStr);
  }

  /** Get amplification data for all domain pairs */
  amplification() {
    return this._matrix.amplification();
  }

  /** Full synergy event history */
  history(filter) {
    return this._matrix.history();
  }

  /** Validate the synergy matrix for completeness */
  validate() {
    return this._matrix.validate();
  }

  /** Reset (not in core, but we can recreate) */
  reset() {
    this._matrix = new SynergyMatrix();
    return { status: 'reset' };
  }
}

module.exports = SynergyService;
