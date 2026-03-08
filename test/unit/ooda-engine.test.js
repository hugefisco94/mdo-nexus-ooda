/**
 * OODA Engine Unit Tests - 30+ assertions
 */
'use strict';

const { OodaEngine, PHASES, TEMPOS, PHASE_DOCTRINE } = require('../../src/core/ooda-engine');

// ── Phase Transitions ──
console.log('  [Phase Transitions]');
const ooda = new OodaEngine();
assert(ooda.phase === 'observe', 'Initial phase is observe');
assert(ooda.cycle === 0, 'Initial cycle is 0');
assert(ooda.tempo === 'operational', 'Default tempo is operational');

const t1 = ooda.advance();
assert(t1.from === 'observe' && t1.to === 'orient', 'observe -> orient');
const t2 = ooda.advance();
assert(t2.from === 'orient' && t2.to === 'decide', 'orient -> decide');
const t3 = ooda.advance();
assert(t3.from === 'decide' && t3.to === 'act', 'decide -> act');
const t4 = ooda.advance();
assert(t4.from === 'act' && t4.to === 'observe', 'act -> observe (wrap)');
assert(ooda.cycle === 1, 'Cycle incremented to 1 after full loop');

// Second full cycle
for (let i = 0; i < 4; i++) ooda.advance();
assert(ooda.cycle === 2, 'Cycle incremented to 2 after second loop');
assert(ooda.phase === 'observe', 'Returns to observe after second loop');

// ── Tempo Settings ──
console.log('  [Tempo Settings]');
ooda.setTempo('strategic');
assert(ooda.tempo === 'strategic', 'setTempo to strategic');
ooda.setTempo('tactical');
assert(ooda.tempo === 'tactical', 'setTempo to tactical');
ooda.setTempo('operational');
assert(ooda.tempo === 'operational', 'setTempo back to operational');

let tempoError = false;
try { ooda.setTempo('AGGRESSIVE'); } catch (e) { tempoError = true; }
assert(tempoError, 'Invalid tempo throws error');

// ── Phase Override ──
console.log('  [Phase Override]');
ooda.setPhase('decide');
assert(ooda.phase === 'decide', 'setPhase to decide works');
ooda.setPhase('act');
assert(ooda.phase === 'act', 'setPhase to act works');

let phaseError = false;
try { ooda.setPhase('invalid'); } catch (e) { phaseError = true; }
assert(phaseError, 'Invalid phase throws error');

// ── Doctrine Mapping ──
console.log('  [Doctrine Mapping]');
assert(PHASE_DOCTRINE.observe.cyberneticsRole === 'sensor', 'observe doctrine role = sensor');
assert(PHASE_DOCTRINE.orient.cyberneticsRole === 'comparator', 'orient doctrine role = comparator');
assert(PHASE_DOCTRINE.decide.cyberneticsRole === 'decision_function', 'decide doctrine role = decision_function');
assert(PHASE_DOCTRINE.act.cyberneticsRole === 'effector', 'act doctrine role = effector');
assert(PHASE_DOCTRINE.observe.gpuModel === '72b', 'observe uses 72b model');
assert(PHASE_DOCTRINE.decide.gpuModel === 'claude', 'decide uses claude model');
assert(PHASE_DOCTRINE.orient.satTechniques.includes('ACH'), 'orient includes ACH technique');
assert(PHASE_DOCTRINE.decide.satTechniques.includes("Devil's Advocate"), 'decide includes Devils Advocate');
assert(PHASE_DOCTRINE.observe.collectionDisciplines.length === 5, '5 collection disciplines');

// ── Recommendation ──
console.log('  [Recommendation]');
ooda.setPhase('observe');
const rec1 = ooda.recommendation();
assert(rec1.phase === 'observe', 'recommendation phase matches');
assert(rec1.agent === 'explore', 'observe recommends explore agent');
assert(rec1.gpuModel === '72b', 'observe recommendation uses 72b');

ooda.setPhase('decide');
const rec2 = ooda.recommendation();
assert(rec2.agent === 'planner', 'decide recommends planner agent');

// ── Reset ──
console.log('  [Reset]');
ooda.reset();
assert(ooda.phase === 'observe', 'Reset returns to observe');
assert(ooda.cycle === 0, 'Reset cycle to 0');
assert(ooda.history.length === 0, 'Reset clears history');

// ── Constants ──
console.log('  [Constants]');
assert(PHASES.length === 4, '4 OODA phases defined');
assert(PHASES[0] === 'observe', 'First phase is observe');
assert(TEMPOS.length === 3, '3 tempo levels defined');
