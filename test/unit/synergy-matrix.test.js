/**
 * Synergy Matrix Unit Tests - 25+ assertions
 */
'use strict';

const { SynergyMatrix, DOMAINS, FIRE_INCREMENT, AMPLIFICATION_THRESHOLD } = require('../../src/core/synergy-matrix');

// ── 6x6 Matrix Initialization ──
console.log('  [Matrix Initialization]');
const sm = new SynergyMatrix();
assert(sm.size === 6, 'Matrix size = 6');
assert(sm.domains.length === 6, '6 domains registered');
assert(DOMAINS.includes('INTEL'), 'INTEL domain exists');
assert(DOMAINS.includes('CYBER'), 'CYBER domain exists');
assert(DOMAINS.includes('AGENT'), 'AGENT domain exists');

const grid = sm.get();
assert(grid['INTEL']['INTEL'] === 1.0, 'Self-synergy = 1.0');
assert(grid['INTEL']['CYBER'] === 0.5, 'Default cross-domain = 0.5');
assert(grid['CODE']['DATA'] === 0.5, 'CODE->DATA default = 0.5');

// ── fire() Creates Synergy Events ──
console.log('  [fire() Events]');
const f1 = sm.fire('INTEL', 'CYBER');
assert(f1.from === 'INTEL' && f1.to === 'CYBER', 'fire() returns from/to');
assert(f1.prevStrength === 0.5, 'Previous strength was 0.5');
assert(Math.abs(f1.strength - 0.55) < 0.001, 'New strength = 0.55 after fire');
assert(f1.fireCount === 1, 'Fire count = 1');
assert(f1.amplified === false, 'Not amplified after 1 fire');

const f2 = sm.fire('INTEL', 'CYBER');
assert(Math.abs(f2.strength - 0.60) < 0.001, 'Strength increments to 0.60');
assert(f2.fireCount === 2, 'Fire count = 2');

// ── Amplification Calculation ──
console.log('  [Amplification]');
sm.fire('INTEL', 'CYBER'); // count=3
const f4 = sm.fire('INTEL', 'CYBER'); // count=4
assert(f4.amplified === true, 'Amplified after > threshold fires');
assert(f4.fireCount === 4, 'Fire count = 4');

const amp = sm.amplification();
assert(amp.totalEvents >= 4, 'At least 4 total events');
assert(amp.hotPairs.length === 1, '1 hot pair (INTEL->CYBER)');
assert(amp.hotPairs[0].pair === 'INTEL->CYBER', 'Hot pair is INTEL->CYBER');

// Fire another pair multiple times
for (let i = 0; i < 5; i++) sm.fire('CODE', 'AGENT');
const amp2 = sm.amplification();
assert(amp2.hotPairs.length === 2, '2 hot pairs after CODE->AGENT amplified');

// ── validate() Checks All Domains Connected ──
console.log('  [validate()]');
const v1 = sm.validate();
assert(v1.valid === true, 'Default matrix is fully connected');
assert(v1.domainCount === 6, 'Validates 6 domains');
assert(v1.connectionCount === 30, '30 cross-domain connections (6x5)');
assert(v1.issues.length === 0, 'No disconnected domains');

// ── History Tracking ──
console.log('  [History Tracking]');
const hist = sm.history();
assert(hist.length >= 9, 'At least 9 events in history (4+5)');
assert(hist[0].from === 'INTEL', 'First event from INTEL');
assert(hist[0].to === 'CYBER', 'First event to CYBER');

// ── Load from JSON ──
console.log('  [JSON Initialization]');
const jsonData = {
  labels: ['A', 'B', 'C', 'D', 'E', 'F'],
  matrix: [
    [1, 0.8, 0.3, 0.4, 0.5, 0.6],
    [0.8, 1, 0.4, 0.5, 0.6, 0.7],
    [0.3, 0.4, 1, 0.6, 0.7, 0.8],
    [0.4, 0.5, 0.6, 1, 0.8, 0.9],
    [0.5, 0.6, 0.7, 0.8, 1, 0.3],
    [0.6, 0.7, 0.8, 0.9, 0.3, 1],
  ]
};
const sm2 = new SynergyMatrix(jsonData);
assert(sm2.strength('A', 'B') === 0.8, 'JSON-loaded strength A->B = 0.8');
assert(sm2.strength('C', 'D') === 0.6, 'JSON-loaded strength C->D = 0.6');
