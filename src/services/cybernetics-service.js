'use strict';

/**
 * CyberneticsService - Wraps core/cybernetics-engine.js + core/feedback-loop.js
 * Manages feedback cycles, convergence tracking, and recursive input preparation.
 */

const { CyberneticsEngine } = require('../core/cybernetics-engine');
const { FeedbackLoop } = require('../core/feedback-loop');

class CyberneticsService {
  constructor(options) {
    this._engine = new CyberneticsEngine(options);
    this._feedbackLoop = new FeedbackLoop();
  }

  /**
   * Start a new feedback loop cycle
   * @param {number|string} order - 1 or 2 (or 'first'/'second')
   * @param {object} input - initial data
   */
  startLoop(order, input) {
    const numOrder = typeof order === 'number' ? order : (order === 'second' ? 2 : 1);
    const cycle = this._engine.startCycle(numOrder, input);
    this._feedbackLoop.reset();
    return { cycleId: cycle.id, order: numOrder, status: 'started' };
  }

  /**
   * Record a phase result within the current cycle
   * @param {string} phase - observe|orient|decide|act
   * @param {object} result - phase output
   * @param {number} confidence - 0.0-1.0
   */
  recordPhase(phase, result, confidence) {
    this._engine.recordPhase(phase, result, confidence);
    return { phase, confidence, recorded: true };
  }

  /**
   * Complete the current cycle
   * @param {number} reliability - overall cycle reliability 0.0-1.0
   * @param {object} feedback - what to feed into next cycle
   */
  completeCycle(reliability, feedback) {
    return this._engine.completeCycle(reliability, feedback);
  }

  /** Determine if another cycle iteration is warranted */
  shouldContinue() {
    return this._engine.shouldContinue();
  }

  /** Summary of convergence across all cycles */
  convergenceSummary() {
    return this._engine.convergenceSummary();
  }

  /** Prepare input for the next recursive (2nd-order) cycle */
  prepareRecursiveInput() {
    return this._engine.prepareRecursiveInput();
  }

  /** Check if auto-reloop should trigger */
  shouldAutoReloop(event) {
    return this._engine.shouldAutoReloop(event);
  }

  /** Get the feedback loop instance */
  feedbackLoop() {
    return this._feedbackLoop;
  }
}

module.exports = CyberneticsService;
