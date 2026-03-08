/**
 * Cybernetics Engine Unit Tests - 25+ assertions
 */
'use strict';

const { CyberneticsEngine } = require('../../src/core/cybernetics-engine');

// ── 1st Order Loop (Simple Feedback) ──
console.log('  [1st Order Loop]');
const cyber = new CyberneticsEngine({ reliabilityThreshold: 0.90, maxCycles: 5 });

const c1Handle = cyber.startCycle(1, { data: 'raw signals' });
assert(c1Handle.order === 1, 'Cycle 1 is 1st order');
assert(c1Handle.id === 1, 'First cycle id = 1');

cyber.recordPhase('observe', { sensors: true }, 0.7);
cyber.recordPhase('orient', { analysis: true }, 0.75);
cyber.recordPhase('decide', { plan: true }, 0.8);
cyber.recordPhase('act', { execute: true }, 0.85);

const c1 = cyber.completeCycle(0.80);
assert(c1.reliability === 0.80, '1st order reliability = 0.80');
assert(c1.converged === false, '1st order not converged (0.80 < 0.90)');
assert(c1.order === 1, 'Completed cycle is 1st order');
assert(c1.delta === 0.80, 'Delta from 0 to 0.80');

// ── shouldContinue after 1st cycle ──
console.log('  [shouldContinue Logic]');
const sc1 = cyber.shouldContinue();
assert(sc1.shouldContinue === true, 'Should continue after unconverged cycle');
assert(sc1.reason === 'below_threshold', 'Reason: below_threshold');

// ── 2nd Order Loop (Self-Referential) ──
console.log('  [2nd Order Loop]');
const ri = cyber.prepareRecursiveInput();
assert(ri !== null, 'Recursive input is not null');
assert(ri.order === 2, 'Recursive input order = 2');
assert(ri.metaQuestions.length === 5, '5 meta-questions for self-reference');
assert(ri.previousReliability === 0.80, 'Previous reliability carried forward');

cyber.startCycle(2, ri);
cyber.recordPhase('observe', {}, 0.85);
cyber.recordPhase('orient', {}, 0.88);
cyber.recordPhase('decide', {}, 0.91);
cyber.recordPhase('act', {}, 0.93);
const c2 = cyber.completeCycle(0.92);
assert(c2.converged === true, '2nd order converged (0.92 >= 0.90)');
assert(c2.order === 2, 'Completed cycle is 2nd order');
assert(c2.delta === 0.12, 'Delta = 0.92 - 0.80 = 0.12');

// ── Convergence Detection ──
console.log('  [Convergence Detection]');
const sc2 = cyber.shouldContinue();
assert(sc2.shouldContinue === false, 'Should NOT continue after convergence');
assert(sc2.reason === 'threshold_met', 'Reason: threshold_met');

// ── Convergence Summary ──
console.log('  [Convergence Summary]');
const cs = cyber.convergenceSummary();
assert(cs.totalCycles === 2, 'Total 2 cycles');
assert(cs.converged === true, 'Final state: converged');
assert(cs.finalReliability === 0.92, 'Final reliability = 0.92');
assert(cs.initialReliability === 0.80, 'Initial reliability = 0.80');
assert(cs.orders.first === 1, '1 first-order cycle');
assert(cs.orders.second === 1, '1 second-order cycle');
assert(cs.totalDelta === 0.12, 'Total delta = 0.12');

// ── Reliability Tracking ──
console.log('  [Reliability Tracking]');
assert(cyber.convergenceHistory.length === 2, '2 entries in convergence history');
assert(cyber.convergenceHistory[0].reliability === 0.80, 'History[0] reliability = 0.80');
assert(cyber.convergenceHistory[1].reliability === 0.92, 'History[1] reliability = 0.92');
assert(cyber.convergenceHistory[1].converged === true, 'History[1] converged = true');

// ── Max Cycles Limit ──
console.log('  [Max Cycles Limit]');
const cyber2 = new CyberneticsEngine({ reliabilityThreshold: 0.99, maxCycles: 2 });
cyber2.startCycle(1, {}); cyber2.completeCycle(0.5);
cyber2.startCycle(1, {}); cyber2.completeCycle(0.6);
const sc3 = cyber2.shouldContinue();
assert(sc3.shouldContinue === false, 'Stops at max cycles');
assert(sc3.reason === 'max_cycles_reached', 'Reason: max_cycles_reached');
