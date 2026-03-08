/**
 * Cross-Domain Synergy Integration Tests - 15+ assertions
 * Tests synergy fire propagation and cumulative amplification across domains.
 */
'use strict';

const { SynergyMatrix, DOMAINS, AMPLIFICATION_THRESHOLD } = require('../../src/core/synergy-matrix');

// ── Synergy Fire Propagation Across Domains ──
console.log('  [Fire Propagation]');
const sm = new SynergyMatrix();

// Simulate a chain reaction: INTEL -> CYBER -> CODE -> AGENT
const r1 = sm.fire('INTEL', 'CYBER', 'threat_detected');
assert(r1.strength > 0.5, 'INTEL->CYBER strength increased');
assert(r1.event === 'threat_detected', 'Event name preserved');

const r2 = sm.fire('CYBER', 'CODE', 'patch_required');
assert(r2.strength > 0.5, 'CYBER->CODE strength increased');

const r3 = sm.fire('CODE', 'AGENT', 'deploy_fix');
assert(r3.strength > 0.5, 'CODE->AGENT strength increased');

const r4 = sm.fire('AGENT', 'INTEL', 'verify_fix');
assert(r4.strength > 0.5, 'AGENT->INTEL strength increased (loop closed)');

// Check that original connections are unchanged
assert(sm.strength('DATA', 'INFRA') === 0.5, 'Unrelated pair DATA->INFRA unchanged');
assert(sm.strength('INFRA', 'DATA') === 0.5, 'Unrelated pair INFRA->DATA unchanged');

// ── Cumulative Amplification ──
console.log('  [Cumulative Amplification]');

// Fire INTEL->CYBER repeatedly to trigger amplification
for (let i = 0; i < AMPLIFICATION_THRESHOLD; i++) {
  sm.fire('INTEL', 'CYBER', `repeat_${i}`);
}

const amp = sm.amplification();
assert(amp.totalEvents > 4, 'Multiple events tracked');
assert(amp.hotPairs.length >= 1, 'At least 1 hot pair exists');

const icPair = amp.pairs.find(p => p.pair === 'INTEL->CYBER');
assert(icPair !== undefined, 'INTEL->CYBER pair tracked');
assert(icPair.amplified === true, 'INTEL->CYBER is amplified');
assert(icPair.fireCount > AMPLIFICATION_THRESHOLD, 'Fire count exceeds threshold');

// Verify strength accumulated correctly
const expectedStrength = 0.5 + (icPair.fireCount * 0.05);
const cappedStrength = Math.min(1.0, expectedStrength);
assert(Math.abs(icPair.currentStrength - cappedStrength) < 0.001, 'Accumulated strength matches expected');

// ── Multi-Domain Simultaneous Synergy ──
console.log('  [Multi-Domain Synergy]');
// Fire between all adjacent domain pairs
const pairsToFire = [
  ['INTEL', 'DATA'], ['DATA', 'CODE'], ['CODE', 'INFRA'],
  ['INFRA', 'AGENT'], ['AGENT', 'CYBER']
];

for (const [from, to] of pairsToFire) {
  for (let i = 0; i < 5; i++) sm.fire(from, to);
}

const amp2 = sm.amplification();
assert(amp2.hotPairs.length >= 6, 'At least 6 amplified pairs after multi-domain firing');

// ── Validation After Heavy Activity ──
console.log('  [Post-Activity Validation]');
const v = sm.validate();
assert(v.valid === true, 'Matrix remains valid after heavy activity');
assert(v.domainCount === 6, 'Still 6 domains');

// ── History Completeness ──
const hist = sm.history();
assert(hist.length > 20, 'History tracks all events (20+)');
assert(hist.every(h => h.from && h.to && h.ts), 'All history entries have from, to, ts');
