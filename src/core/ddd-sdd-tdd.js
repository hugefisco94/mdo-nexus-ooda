/**
 * DDD-SDD-TDD Engine - Triple-D Development Cycle
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * DDD (Domain-Driven Design) -> SDD (Specification-Driven Design) -> TDD (Test-Driven Development)
 * Each phase produces artifacts that feed into the next.
 * After TDD, feedback loops back to DDD for the next cycle.
 *
 * Integrated with CyberneticsEngine for convergence tracking.
 */
'use strict';

const PHASES = ['DDD', 'SDD', 'TDD', 'FEEDBACK'];

class DddSddTddEngine {
  constructor(options = {}) {
    this.phase = 'DDD';
    this.cycle = 0;
    this.maxCycles = options.maxCycles || 10;
    this.convergenceThreshold = options.convergenceThreshold || 0.90;
    this.history = [];
    this.metrics = {
      domainsCovered: 0,
      specsGenerated: 0,
      testsPassed: 0,
      testsFailed: 0,
      convergence: 0,
    };
  }

  /** Get current state */
  state() {
    return {
      phase: this.phase,
      cycle: this.cycle,
      metrics: { ...this.metrics },
      historyLength: this.history.length,
    };
  }

  /** Advance to next phase */
  advance(data = {}) {
    const prev = this.phase;
    const idx = PHASES.indexOf(this.phase);
    const nextIdx = (idx + 1) % PHASES.length;

    this.history.push({
      phase: prev,
      cycle: this.cycle,
      data,
      completedAt: new Date().toISOString(),
    });

    // Update metrics based on phase
    switch (prev) {
      case 'DDD':
        this.metrics.domainsCovered += (data.domains || 0);
        break;
      case 'SDD':
        this.metrics.specsGenerated += (data.specs || 0);
        break;
      case 'TDD':
        this.metrics.testsPassed += (data.passed || 0);
        this.metrics.testsFailed += (data.failed || 0);
        break;
      case 'FEEDBACK':
        this.metrics.convergence = data.convergence || this.metrics.convergence;
        this.cycle++;
        break;
    }

    this.phase = PHASES[nextIdx];

    return { from: prev, to: this.phase, cycle: this.cycle };
  }

  /** Check if cycle has converged */
  isConverged() {
    return this.metrics.convergence >= this.convergenceThreshold;
  }

  /** Check if should continue cycling */
  shouldContinue() {
    if (this.isConverged()) return { shouldContinue: false, reason: 'converged' };
    if (this.cycle >= this.maxCycles) return { shouldContinue: false, reason: 'max_cycles' };
    return { shouldContinue: true, reason: 'in_progress' };
  }

  /** Get summary metrics */
  summary() {
    return {
      cycles: this.cycle,
      phase: this.phase,
      converged: this.isConverged(),
      metrics: { ...this.metrics },
      transitions: this.history.length,
    };
  }

  /** Reset the engine */
  reset() {
    this.phase = 'DDD';
    this.cycle = 0;
    this.history = [];
    this.metrics = {
      domainsCovered: 0,
      specsGenerated: 0,
      testsPassed: 0,
      testsFailed: 0,
      convergence: 0,
    };
  }
}

module.exports = { DddSddTddEngine, PHASES };
