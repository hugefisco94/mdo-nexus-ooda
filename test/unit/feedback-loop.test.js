/**
 * Feedback Loop Unit Tests - 20+ assertions
 */
'use strict';

const { FeedbackLoop, DEFAULT_MAX_ITERATIONS, DEFAULT_GAIN, DEFAULT_TOLERANCE } = require('../../src/core/feedback-loop');

// ── Single Iteration ──
console.log('  [Single Iteration]');
const fl = new FeedbackLoop({ setpoint: 1.0, gain: 0.5, initialValue: 0 });
const r1 = fl.iterate();
assert(r1.iteration === 1, 'First iteration = 1');
assert(r1.measurement === 0, 'Initial measurement = 0');
assert(r1.error === 1.0, 'Error = setpoint - measurement = 1.0');
assert(r1.correction === 0.5, 'Correction = error * gain = 0.5');
assert(r1.newValue === 0.5, 'New value = 0 + 0.5 = 0.5');
assert(r1.converged === false, 'Not converged yet');

const r2 = fl.iterate();
assert(r2.measurement === 0.5, 'Second measurement = 0.5');
assert(r2.error === 0.5, 'Error reduced to 0.5');
assert(r2.newValue === 0.75, 'Value approaches setpoint: 0.75');

// ── Convergence with Simple Setpoint ──
console.log('  [Convergence]');
const fl2 = new FeedbackLoop({ setpoint: 1.0, gain: 0.5, tolerance: 0.01, initialValue: 0 });
const result = fl2.run();
assert(result.converged === true, 'Loop converges');
assert(result.finalError < 0.01, 'Final error below tolerance');
assert(Math.abs(result.finalValue - 1.0) < 0.02, 'Final value near setpoint');
assert(result.iterations > 1, 'Took multiple iterations');
assert(result.iterations < 50, 'Converged in under 50 iterations');

// ── Error Reduction Over Iterations ──
console.log('  [Error Reduction]');
const fl3 = new FeedbackLoop({ setpoint: 10.0, gain: 0.3, initialValue: 0, tolerance: 0.1 });
fl3.iterate(); // iter 1
fl3.iterate(); // iter 2
fl3.iterate(); // iter 3
assert(fl3.history[0].absError > fl3.history[1].absError, 'Error decreases iter 1->2');
assert(fl3.history[1].absError > fl3.history[2].absError, 'Error decreases iter 2->3');
assert(fl3.history.length === 3, '3 iterations recorded in history');

// ── Max Iteration Limit ──
console.log('  [Max Iteration Limit]');
const fl4 = new FeedbackLoop({ setpoint: 1000.0, gain: 0.01, maxIterations: 5, tolerance: 0.001, initialValue: 0 });
const r4 = fl4.run();
assert(r4.converged === false, 'Does not converge with tiny gain and few iterations');
assert(r4.iterations === 5, 'Stopped at max iterations = 5');

// ── shouldContinue ──
console.log('  [shouldContinue]');
const fl5 = new FeedbackLoop({ setpoint: 1.0, gain: 0.5, maxIterations: 3, initialValue: 0 });
const sc1 = fl5.shouldContinue();
assert(sc1.shouldContinue === true, 'Should continue before any iteration');
assert(sc1.reason === 'in_progress', 'Reason: in_progress');

fl5.run();
const sc2 = fl5.shouldContinue();
assert(sc2.shouldContinue === false, 'Should not continue after run()');

// ── Reset ──
console.log('  [Reset]');
fl5.reset();
assert(fl5.iteration === 0, 'Reset iteration to 0');
assert(fl5.converged === false, 'Reset converged to false');
assert(fl5.history.length === 0, 'Reset clears history');

// ── Constants ──
console.log('  [Constants]');
assert(DEFAULT_MAX_ITERATIONS === 100, 'Default max iterations = 100');
assert(DEFAULT_GAIN === 0.5, 'Default gain = 0.5');
assert(DEFAULT_TOLERANCE === 0.01, 'Default tolerance = 0.01');
