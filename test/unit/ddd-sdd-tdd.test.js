/**
 * DDD-SDD-TDD Engine Unit Tests - 15+ assertions
 */
'use strict';

const { DddSddTddEngine, PHASES } = require('../../src/core/ddd-sdd-tdd');

// ── Phase Progression ──
console.log('  [Phase Progression]');
const engine = new DddSddTddEngine();
assert(engine.phase === 'DDD', 'Initial phase is DDD');
assert(engine.cycle === 0, 'Initial cycle = 0');

const t1 = engine.advance({ domains: 3 });
assert(t1.from === 'DDD' && t1.to === 'SDD', 'DDD -> SDD');

const t2 = engine.advance({ specs: 5 });
assert(t2.from === 'SDD' && t2.to === 'TDD', 'SDD -> TDD');

const t3 = engine.advance({ passed: 10, failed: 1 });
assert(t3.from === 'TDD' && t3.to === 'FEEDBACK', 'TDD -> FEEDBACK');

const t4 = engine.advance({ convergence: 0.7 });
assert(t4.from === 'FEEDBACK' && t4.to === 'DDD', 'FEEDBACK -> DDD (loop)');

// ── Cycle Counting ──
console.log('  [Cycle Counting]');
assert(engine.cycle === 1, 'Cycle incremented after FEEDBACK');
assert(engine.phase === 'DDD', 'Back to DDD for next cycle');

// Advance through another full cycle
engine.advance({ domains: 2 });
engine.advance({ specs: 3 });
engine.advance({ passed: 8, failed: 0 });
engine.advance({ convergence: 0.95 });
assert(engine.cycle === 2, 'Cycle = 2 after second loop');

// ── Convergence Tracking ──
console.log('  [Convergence Tracking]');
assert(engine.metrics.convergence === 0.95, 'Convergence updated to 0.95');
assert(engine.isConverged() === true, 'Engine reports converged (0.95 >= 0.90)');

const sc = engine.shouldContinue();
assert(sc.shouldContinue === false, 'Should not continue when converged');
assert(sc.reason === 'converged', 'Reason: converged');

// ── Metrics Output ──
console.log('  [Metrics Output]');
const summary = engine.summary();
assert(summary.cycles === 2, 'Summary shows 2 cycles');
assert(summary.converged === true, 'Summary shows converged');
assert(summary.metrics.domainsCovered === 5, 'Total domains covered = 3 + 2');
assert(summary.metrics.specsGenerated === 8, 'Total specs = 5 + 3');
assert(summary.metrics.testsPassed === 18, 'Total tests passed = 10 + 8');
assert(summary.metrics.testsFailed === 1, 'Total tests failed = 1');
assert(summary.transitions === 8, '8 transitions total (4+4)');

// ── Constants ──
console.log('  [Constants]');
assert(PHASES.length === 4, '4 phases in DDD-SDD-TDD cycle');
assert(PHASES[0] === 'DDD', 'First phase is DDD');
assert(PHASES[3] === 'FEEDBACK', 'Last phase is FEEDBACK');
