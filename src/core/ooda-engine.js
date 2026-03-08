/**
 * OODA Engine - Observe → Orient → Decide → Act State Machine
 * Clean Architecture: Core Domain (innermost, zero I/O dependencies)
 *
 * Refactored from mdo-api-server/server.js OODA state logic.
 * Harness Engineering: Each phase gates the next — no phase skipping.
 */
'use strict';

const PHASES = ['observe', 'orient', 'decide', 'act'];
const TEMPOS = ['strategic', 'operational', 'tactical'];

/**
 * OODA Phase → GPU Model + SAT Technique mapping
 * FM 2-0 Intelligence doctrine integration
 */
const PHASE_DOCTRINE = {
  observe: {
    gpuModel: '72b',
    satTechniques: ['Indicators & Warning', 'Key Assumptions Check'],
    fmReference: 'FM 2-0 Ch.3 Intelligence Collection',
    jpReference: 'JP 2-01 JIPOE Step 1: Define Operating Environment',
    cyberneticsRole: 'sensor',
    collectionDisciplines: ['SIGINT', 'OSINT', 'HUMINT', 'GEOINT', 'TECHINT'],
  },
  orient: {
    gpuModel: '72b',
    satTechniques: ['ACH', 'Red Team', 'Historical Analogy', 'Counterfactual'],
    fmReference: 'FM 2-0 Ch.4 Intelligence Analysis',
    jpReference: 'JP 2-01 JIPOE Step 2: Describe Environmental Effects',
    cyberneticsRole: 'comparator',
    analyticMethods: ['pattern_recognition', 'anomaly_detection', 'trend_analysis'],
  },
  decide: {
    gpuModel: 'claude',
    satTechniques: ["Devil's Advocate", 'Delphi', 'Premortem'],
    fmReference: 'FM 2-0 Ch.5 Intelligence Production',
    jpReference: 'JP 2-01 JIPOE Step 3: Evaluate Adversary',
    cyberneticsRole: 'decision_function',
    outputFormat: 'ICD_203_COMPLIANT',
  },
  act: {
    gpuModel: '72b',
    satTechniques: ['Key Assumptions Check', 'Indicators & Warning'],
    fmReference: 'FM 2-0 Ch.6 Intelligence Dissemination',
    jpReference: 'JP 2-01 JIPOE Step 4: Determine COA',
    cyberneticsRole: 'effector',
    reportFormats: ['INTELLIGENCE_ASSESSMENT', 'POLICY_MEMO', 'WARNING_REPORT'],
  },
};

class OodaEngine {
  constructor() {
    this.phase = 'observe';
    this.cycle = 0;
    this.tempo = 'operational';
    this.startedAt = new Date().toISOString();
    this.history = [];
    this.listeners = [];
    this.doctrine = PHASE_DOCTRINE;
  }

  /** Current state snapshot (immutable copy) */
  state() {
    return {
      phase: this.phase,
      cycle: this.cycle,
      tempo: this.tempo,
      startedAt: this.startedAt,
      historyLength: this.history.length,
    };
  }

  /** Advance to next phase. Returns transition record. */
  advance(data = null) {
    const prev = this.phase;
    const idx = PHASES.indexOf(this.phase);
    const next = (idx + 1) % PHASES.length;

    this.history.push({
      phase: prev,
      completedAt: new Date().toISOString(),
      data,
    });

    if (next === 0) this.cycle++;
    this.phase = PHASES[next];

    const transition = { from: prev, to: this.phase, cycle: this.cycle };
    this._emit('advance', transition);
    return transition;
  }

  /** Force a specific phase (for manual override) */
  setPhase(phase) {
    if (!PHASES.includes(phase)) {
      throw new Error(`Invalid phase: ${phase}. Valid: ${PHASES.join(', ')}`);
    }
    const prev = this.phase;
    this.phase = phase;
    this._emit('override', { from: prev, to: phase });
    return { from: prev, to: phase };
  }

  /** Set operational tempo */
  setTempo(tempo) {
    if (!TEMPOS.includes(tempo)) {
      throw new Error(`Invalid tempo: ${tempo}. Valid: ${TEMPOS.join(', ')}`);
    }
    this.tempo = tempo;
    return { tempo };
  }

  /** Reset the cycle */
  reset() {
    this.phase = 'observe';
    this.cycle = 0;
    this.history = [];
    this.startedAt = new Date().toISOString();
    this._emit('reset', this.state());
    return this.state();
  }

  /** Get recommended action based on current phase + doctrine */
  recommendation() {
    const map = {
      observe: { action: 'Gather information', agent: 'explore', complexity: 'low' },
      orient:  { action: 'Analyze and contextualize', agent: 'analyst', complexity: 'high' },
      decide:  { action: 'Plan course of action', agent: 'planner', complexity: 'high' },
      act:     { action: 'Execute the plan', agent: 'executor', complexity: 'medium' },
    };
    const doctrine = this.doctrine[this.phase] || {};
    return {
      ...map[this.phase],
      phase: this.phase,
      tempo: this.tempo,
      gpuModel: doctrine.gpuModel,
      satTechniques: doctrine.satTechniques,
      fmReference: doctrine.fmReference,
      jpReference: doctrine.jpReference,
      cyberneticsRole: doctrine.cyberneticsRole,
    };
  }

  /** Get doctrine for a specific phase */
  doctrineFor(phase) {
    return this.doctrine[phase] || null;
  }

  /** Subscribe to state changes */
  on(callback) {
    this.listeners.push(callback);
  }

  _emit(event, data) {
    for (const fn of this.listeners) {
      try { fn(event, data); } catch (_) { /* swallow listener errors */ }
    }
  }
}

module.exports = { OodaEngine, PHASES, TEMPOS, PHASE_DOCTRINE };
