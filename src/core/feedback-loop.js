/**
 * Feedback Loop - Generic PID-inspired Control Loop
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * Iterates toward a setpoint by measuring error and applying corrections.
 * Used by CyberneticsEngine for convergence tracking.
 */
'use strict';

const DEFAULT_MAX_ITERATIONS = 100;
const DEFAULT_GAIN = 0.5;
const DEFAULT_TOLERANCE = 0.01;

class FeedbackLoop {
  constructor(options = {}) {
    this.setpoint = options.setpoint || 1.0;
    this.gain = options.gain || DEFAULT_GAIN;
    this.tolerance = options.tolerance || DEFAULT_TOLERANCE;
    this.maxIterations = options.maxIterations || DEFAULT_MAX_ITERATIONS;
    this.history = [];
    this.iteration = 0;
    this.converged = false;
    this.currentValue = options.initialValue || 0;
  }

  /**
   * Run a single iteration
   * @param {number} measurement - current observed value (optional, uses currentValue if omitted)
   * @returns {object} iteration result with error, correction, and new value
   */
  iterate(measurement) {
    if (measurement !== undefined) {
      this.currentValue = measurement;
    }

    const error = this.setpoint - this.currentValue;
    const correction = error * this.gain;
    const newValue = this.currentValue + correction;

    this.iteration++;
    const record = {
      iteration: this.iteration,
      measurement: this.currentValue,
      error,
      correction,
      newValue,
      absError: Math.abs(error),
      converged: Math.abs(error) <= this.tolerance,
    };

    this.history.push(record);
    this.currentValue = newValue;

    if (record.converged) {
      this.converged = true;
    }

    return record;
  }

  /**
   * Run iterations until convergence or max iterations
   * @returns {object} convergence result
   */
  run() {
    while (this.iteration < this.maxIterations && !this.converged) {
      this.iterate();
    }

    return {
      converged: this.converged,
      iterations: this.iteration,
      finalValue: this.currentValue,
      finalError: Math.abs(this.setpoint - this.currentValue),
      history: this.history,
    };
  }

  /**
   * Check if loop should continue
   * @returns {object} { shouldContinue, reason }
   */
  shouldContinue() {
    if (this.converged) return { shouldContinue: false, reason: 'converged' };
    if (this.iteration >= this.maxIterations) return { shouldContinue: false, reason: 'max_iterations' };
    return { shouldContinue: true, reason: 'in_progress' };
  }

  /** Reset the loop */
  reset() {
    this.history = [];
    this.iteration = 0;
    this.converged = false;
    this.currentValue = 0;
  }

  /** Static factory */
  static create(options) {
    return new FeedbackLoop(options);
  }
}

module.exports = { FeedbackLoop, DEFAULT_MAX_ITERATIONS, DEFAULT_GAIN, DEFAULT_TOLERANCE };
