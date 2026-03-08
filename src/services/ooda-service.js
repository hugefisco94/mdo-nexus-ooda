'use strict';

/**
 * OODAService - Wraps core/ooda-engine.js
 * Manages the Observe-Orient-Decide-Act loop lifecycle.
 */

const { OodaEngine, PHASES, TEMPOS } = require('../core/ooda-engine');

class OODAService {
  constructor() {
    this._engine = new OodaEngine();
  }

  /** Current OODA state */
  state() {
    return this._engine.state();
  }

  /** Advance to the next OODA phase */
  advance(data) {
    return this._engine.advance(data);
  }

  /** Set operational tempo */
  setTempo(tempo) {
    try {
      return this._engine.setTempo(tempo);
    } catch (e) {
      return { error: e.message, validTempos: TEMPOS };
    }
  }

  /** Reset the OODA loop */
  reset() {
    return this._engine.reset();
  }

  /** Full phase transition history */
  history() {
    return this._engine.history.slice();
  }

  /** Get recommendation for current phase */
  recommendation() {
    return this._engine.recommendation();
  }

  /** Get doctrine for a specific phase */
  doctrineFor(phase) {
    return this._engine.doctrineFor(phase);
  }

  /** Force a specific phase (manual override) */
  setPhase(phase) {
    try {
      return this._engine.setPhase(phase);
    } catch (e) {
      return { error: e.message, validPhases: PHASES };
    }
  }

  /** Subscribe to state changes */
  on(callback) {
    this._engine.on(callback);
  }
}

module.exports = OODAService;
