/**
 * OODA + Cybernetics Integration Tests - 15+ assertions
 * Tests OODA cycle with cybernetics feedback loop integration.
 */
'use strict';

const { OodaEngine, PHASE_DOCTRINE } = require('../../src/core/ooda-engine');
const { CyberneticsEngine } = require('../../src/core/cybernetics-engine');

// ── OODA Cycle with Cybernetics Feedback ──
console.log('  [OODA + Cybernetics Integration]');
const ooda = new OodaEngine();
const cyber = new CyberneticsEngine({ reliabilityThreshold: 0.85, maxCycles: 5 });

// Cycle 1: Run full OODA loop with cybernetics tracking
cyber.startCycle(1, { source: 'ooda_cycle_1' });

// OBSERVE phase
assert(ooda.phase === 'observe', 'Start at observe');
const obsDoctrine = PHASE_DOCTRINE[ooda.phase];
assert(obsDoctrine.cyberneticsRole === 'sensor', 'Observe maps to sensor role');
cyber.recordPhase('observe', { signals: 12 }, 0.7);
ooda.advance();

// ORIENT phase
assert(ooda.phase === 'orient', 'Advanced to orient');
const oriDoctrine = PHASE_DOCTRINE[ooda.phase];
assert(oriDoctrine.cyberneticsRole === 'comparator', 'Orient maps to comparator role');
cyber.recordPhase('orient', { patterns: 3 }, 0.75);
ooda.advance();

// DECIDE phase
assert(ooda.phase === 'decide', 'Advanced to decide');
cyber.recordPhase('decide', { options: 2 }, 0.8);
ooda.advance();

// ACT phase
assert(ooda.phase === 'act', 'Advanced to act');
cyber.recordPhase('act', { actions: 1 }, 0.82);
ooda.advance();

assert(ooda.cycle === 1, 'OODA completed cycle 1');
const c1 = cyber.completeCycle(0.78);
assert(c1.converged === false, 'Cyber cycle 1 not converged (0.78 < 0.85)');
assert(c1.reliability === 0.78, 'Cycle 1 reliability = 0.78');

// ── Convergence Over Multiple OODA Cycles ──
console.log('  [Multi-Cycle Convergence]');
const sc1 = cyber.shouldContinue();
assert(sc1.shouldContinue === true, 'Should continue for cycle 2');

// Cycle 2: 2nd order with recursive input
const ri = cyber.prepareRecursiveInput();
assert(ri.order === 2, 'Recursive input is 2nd order');

cyber.startCycle(2, ri);

// Run another OODA loop
for (const phase of ['observe', 'orient', 'decide', 'act']) {
  cyber.recordPhase(phase, { improved: true }, 0.88);
  ooda.advance();
}

assert(ooda.cycle === 2, 'OODA completed cycle 2');
const c2 = cyber.completeCycle(0.90);
assert(c2.converged === true, 'Cyber cycle 2 converged (0.90 >= 0.85)');

const sc2 = cyber.shouldContinue();
assert(sc2.shouldContinue === false, 'No more cycles needed');

const summary = cyber.convergenceSummary();
assert(summary.totalCycles === 2, 'Total 2 cybernetics cycles');
assert(summary.converged === true, 'Final state: converged');
assert(summary.finalReliability === 0.90, 'Final reliability = 0.90');
assert(summary.orders.first === 1, '1 first-order cycle');
assert(summary.orders.second === 1, '1 second-order cycle');
