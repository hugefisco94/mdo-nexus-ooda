/**
 * Cybernetics Engine - 1st/2nd Order Cybernetics for OODA
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * 1st-Order Cybernetics (Wiener/Ashby):
 *   - Observer external to system
 *   - Linear feedback loop: output → sensor → comparator → effector → output
 *   - OODA mapping: each phase outputs feed next phase input
 *
 * 2nd-Order Cybernetics (von Foerster/Maturana):
 *   - Observer included IN the system (self-referential)
 *   - Recursive: system observes its own observation
 *   - Autopoiesis: self-producing/self-maintaining
 *   - OODA mapping: analysis output feeds back as analysis input
 *
 * References:
 *   - Norbert Wiener, "Cybernetics" (1948)
 *   - Heinz von Foerster, "Observing Systems" (1981)
 *   - John Boyd, "OODA Loop" (1987)
 *   - Humberto Maturana & Francisco Varela, "Autopoiesis" (1980)
 *   - W. Ross Ashby, "Requisite Variety" (1956)
 */
'use strict';

class CyberneticsEngine {
  constructor(options = {}) {
    this.order = 1;                          // current cybernetics order
    this.cycles = [];                        // all completed cycles
    this.currentCycle = null;
    this.reliabilityThreshold = options.reliabilityThreshold || 0.90;
    this.maxCycles = options.maxCycles || 10;
    this.convergenceHistory = [];
    this.entropyLog = [];
    this.autoReloop = options.autoReloop !== undefined ? options.autoReloop : true;
    this.lastConvergence = null;
  }

  /**
   * Start a new cybernetics cycle
   * @param {number} order - 1 or 2
   * @param {object} input - initial data
   * @returns {object} cycle handle
   */
  startCycle(order, input) {
    this.order = order;
    this.currentCycle = {
      id: this.cycles.length + 1,
      order,
      startedAt: new Date().toISOString(),
      phases: { observe: null, orient: null, decide: null, act: null },
      input,
      output: null,
      reliability: 0,
      entropy: { before: null, after: null, reduction: null },
      feedback: null,
      converged: false,
    };
    return this.currentCycle;
  }

  /**
   * Record phase completion in current cycle
   * @param {string} phase - observe|orient|decide|act
   * @param {object} result - phase output
   * @param {number} confidence - 0.0-1.0 for this phase
   */
  recordPhase(phase, result, confidence = 0.5) {
    if (!this.currentCycle) throw new Error('No active cycle. Call startCycle() first.');
    this.currentCycle.phases[phase] = {
      result,
      confidence,
      completedAt: new Date().toISOString(),
    };
  }

  /**
   * Complete current cycle and calculate reliability
   * @param {number} reliability - overall cycle reliability 0.0-1.0
   * @param {object} feedback - what to feed into next cycle
   * @returns {object} completed cycle with convergence status
   */
  completeCycle(reliability, feedback = null) {
    if (!this.currentCycle) throw new Error('No active cycle.');

    const prevReliability = this.cycles.length > 0
      ? this.cycles[this.cycles.length - 1].reliability
      : 0;

    this.currentCycle.reliability = reliability;
    this.currentCycle.feedback = feedback;
    this.currentCycle.completedAt = new Date().toISOString();
    this.currentCycle.converged = reliability >= this.reliabilityThreshold;
    this.currentCycle.delta = reliability - prevReliability;

    // Entropy calculation (Shannon-inspired)
    const phaseConfidences = Object.values(this.currentCycle.phases)
      .filter(p => p !== null)
      .map(p => p.confidence);
    if (phaseConfidences.length > 0) {
      const avgConf = phaseConfidences.reduce((s, c) => s + c, 0) / phaseConfidences.length;
      this.currentCycle.entropy.after = this._shannonEntropy(avgConf);
      if (this.cycles.length > 0) {
        const prevAvg = this._avgConfidence(this.cycles[this.cycles.length - 1]);
        this.currentCycle.entropy.before = this._shannonEntropy(prevAvg);
        this.currentCycle.entropy.reduction = this.currentCycle.entropy.before - this.currentCycle.entropy.after;
      }
    }

    this.cycles.push(this.currentCycle);
    this.convergenceHistory.push({
      cycle: this.currentCycle.id,
      order: this.currentCycle.order,
      reliability,
      delta: this.currentCycle.delta,
      converged: this.currentCycle.converged,
    });

    this.lastConvergence = {
      reliability,
      converged: this.currentCycle.converged,
      timestamp: this.currentCycle.completedAt,
      totalCycles: this.cycles.length + 1,
    };

    const completed = this.currentCycle;
    this.currentCycle = null;
    return completed;
  }

  /**
   * Check if auto-reloop should trigger on new event
   * When autoReloop is enabled, any significant new event will
   * trigger a fresh 1st-2nd Order Cybernetics loop automatically.
   * @param {object} event - new event data
   * @returns {object} { shouldReloop, reason }
   */
  shouldAutoReloop(event = {}) {
    if (!this.autoReloop) return { shouldReloop: false, reason: 'auto_reloop_disabled' };
    if (!this.lastConvergence) return { shouldReloop: true, reason: 'no_prior_convergence' };
    if (event && event.significance && event.significance >= 0.3) {
      return { shouldReloop: true, reason: 'significant_event_detected', event };
    }
    return { shouldReloop: false, reason: 'no_significant_event' };
  }

  /**
   * Check if the recursive loop should continue
   * @returns {object} { shouldContinue, reason, currentReliability }
   */
  shouldContinue() {
    if (this.cycles.length === 0) return { shouldContinue: true, reason: 'no_cycles_yet' };

    const last = this.cycles[this.cycles.length - 1];

    if (last.converged) {
      return { shouldContinue: false, reason: 'threshold_met', currentReliability: last.reliability };
    }
    if (this.cycles.length >= this.maxCycles) {
      return { shouldContinue: false, reason: 'max_cycles_reached', currentReliability: last.reliability };
    }
    // Check for oscillation (reliability going up and down)
    if (this.cycles.length >= 3) {
      const recent = this.cycles.slice(-3).map(c => c.reliability);
      const isOscillating = (recent[1] < recent[0] && recent[2] < recent[1]);
      if (isOscillating) {
        return { shouldContinue: false, reason: 'diverging', currentReliability: last.reliability };
      }
    }

    return { shouldContinue: true, reason: 'below_threshold', currentReliability: last.reliability };
  }

  /**
   * Prepare 2nd-order cybernetics input
   * Takes output of previous cycle and wraps it as self-referential input
   * @returns {object} recursive input for next cycle
   */
  prepareRecursiveInput() {
    if (this.cycles.length === 0) return null;
    const last = this.cycles[this.cycles.length - 1];

    return {
      previousOutput: last.output,
      previousReliability: last.reliability,
      cycleHistory: this.convergenceHistory,
      metaQuestions: [
        '이전 분석의 핵심 가정 중 검증되지 않은 것은?',
        '어떤 인지 편향이 이전 결론에 영향을 미쳤는가?',
        '반대 관점에서 동일 데이터를 어떻게 해석하는가?',
        '이전 분석의 신뢰도 점수 자체가 신뢰할 수 있는가?',
        '어떤 새로운 정보가 결론을 근본적으로 변경하는가?',
      ],
      order: 2,
    };
  }

  /**
   * Get convergence summary
   * @returns {object} convergence metrics
   */
  convergenceSummary() {
    if (this.cycles.length === 0) return { cycles: 0, converged: false };

    const last = this.cycles[this.cycles.length - 1];
    const first = this.cycles[0];

    return {
      totalCycles: this.cycles.length,
      converged: last.converged,
      finalReliability: last.reliability,
      initialReliability: first.reliability,
      totalDelta: last.reliability - first.reliability,
      history: this.convergenceHistory,
      avgEntropyReduction: this._avgEntropyReduction(),
      orders: { first: this.cycles.filter(c => c.order === 1).length, second: this.cycles.filter(c => c.order === 2).length },
    };
  }

  /** Shannon entropy for a probability */
  _shannonEntropy(p) {
    if (p <= 0 || p >= 1) return 0;
    return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
  }

  /** Average confidence of a cycle's phases */
  _avgConfidence(cycle) {
    const vals = Object.values(cycle.phases).filter(p => p !== null).map(p => p.confidence);
    return vals.length > 0 ? vals.reduce((s, c) => s + c, 0) / vals.length : 0.5;
  }

  /** Average entropy reduction across all cycles */
  _avgEntropyReduction() {
    const reductions = this.cycles
      .filter(c => c.entropy.reduction !== null)
      .map(c => c.entropy.reduction);
    return reductions.length > 0 ? reductions.reduce((s, r) => s + r, 0) / reductions.length : 0;
  }
}

module.exports = { CyberneticsEngine };
