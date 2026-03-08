#!/usr/bin/env node
'use strict';

const OODAService = require('../src/services/ooda-service');
const CyberneticsService = require('../src/services/cybernetics-service');
const SynergyService = require('../src/services/synergy-service');
const AgentService = require('../src/services/agent-service');
const DomainService = require('../src/services/domain-service');
const TelemetryService = require('../src/services/telemetry-service');

// --- Services ---
const ooda = new OODAService();
const cybernetics = new CyberneticsService();
const synergy = new SynergyService();
const agent = new AgentService();
const domain = new DomainService();
const telemetry = new TelemetryService({ ooda, cybernetics, synergy, agent, domain });

// --- CLI Helpers ---
function log(label, data) {
  console.log(`\n[${label}]`);
  if (typeof data === 'object') {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

function usage() {
  console.log(`
MDO-Nexus-OODA CLI v1.0.0

Usage: mdo-nexus <command> [options]

Commands:
  status    Show system status (domains, OODA state, convergence)
  cycle     Run a full OODA cycle (observe -> orient -> decide -> act)
  deploy    Start the Express server
  test      Run service self-tests

Options:
  --tempo <strategic|operational|tactical>  Set operational tempo (cycle)
  --tier <T1-Fast|T2-Power|T3-Deep>        Force agent tier (cycle)
  --port <number>                           Server port (deploy, default: 3000)
  --help                                   Show this help
`);
}

// --- Commands ---

function cmdStatus() {
  log('OODA State', ooda.state());
  log('Recommendation', ooda.recommendation());
  log('Domain Status', domain.status());
  log('Domain Health', domain.healthCheck());
  log('Convergence', cybernetics.convergenceSummary());
  log('Synergy Amplification', synergy.amplification());
  log('Synergy Validation', synergy.validate());
  log('Telemetry Snapshot', telemetry.snapshot());
}

function cmdCycle(args) {
  const tempo = args.tempo || 'operational';
  const tier = args.tier || null;

  console.log('\n=== MDO-Nexus OODA Cycle ===');
  console.log(`Tempo: ${tempo}  |  Tier: ${tier || 'auto'}\n`);

  ooda.setTempo(tempo);
  cybernetics.startLoop(1, { trigger: 'cli-cycle', tempo });

  const phases = ['observe', 'orient', 'decide', 'act'];

  for (const phase of phases) {
    console.log(`--- ${phase.toUpperCase()} ---`);

    // Agent swarm call
    const swarmResult = agent.swarmCall(phase, `CLI ${phase} analysis`, tier);
    console.log(`  Agent: ${swarmResult.result.model} | confidence: ${swarmResult.result.confidence}`);

    // Domain resolution
    const domainResult = domain.resolve(phase);
    console.log(`  Domain: ${domainResult.domain} (adapter: ${domainResult.adapter})`);

    // Cross-domain synergy fire
    const synergyDomains = ['INTEL', 'CYBER', 'CODE', 'INFRA', 'DATA', 'AGENT'];
    const fromDomain = synergyDomains[phases.indexOf(phase) % synergyDomains.length];
    const toDomain = synergyDomains[(phases.indexOf(phase) + 1) % synergyDomains.length];
    const synergyResult = synergy.fire(fromDomain, toDomain, { type: `${phase}-synergy` });
    if (synergyResult.error) {
      console.log(`  Synergy: ${synergyResult.error}`);
    } else {
      console.log(`  Synergy: ${fromDomain} -> ${toDomain} (strength: ${synergyResult.strength}, fires: ${synergyResult.fireCount})`);
    }

    // Record cybernetics phase
    cybernetics.recordPhase(phase, swarmResult.result, swarmResult.result.confidence);

    // Advance OODA
    const advance = ooda.advance({ phase, agentResult: swarmResult.id });
    console.log(`  OODA: ${advance.from} -> ${advance.to} (cycle: ${advance.cycle})`);
    console.log('');
  }

  // Complete cycle
  const convergence = cybernetics.convergenceSummary();
  const reliability = convergence.finalReliability || 0.5;
  cybernetics.completeCycle(reliability, 'CLI cycle complete');

  const shouldContinue = cybernetics.shouldContinue();
  log('Cycle Complete', {
    reliability,
    converged: !shouldContinue.shouldContinue,
    reason: shouldContinue.reason
  });

  // 2nd order: prepare recursive input
  const recursive = cybernetics.prepareRecursiveInput();
  if (recursive) {
    log('2nd-Order Recursive Input Available', {
      previousReliability: recursive.previousReliability,
      metaQuestions: recursive.metaQuestions ? recursive.metaQuestions.length : 0
    });
  }

  log('Final State', ooda.state());
}

function cmdDeploy(args) {
  const port = args.port || process.env.PORT || 3000;
  process.env.PORT = String(port);
  console.log(`\n[MDO-Nexus] Starting server on port ${port}...`);
  require('../src/server');
}

function cmdTest() {
  let passed = 0;
  let failed = 0;

  function assert(name, condition) {
    if (condition) {
      console.log(`  PASS: ${name}`);
      passed++;
    } else {
      console.log(`  FAIL: ${name}`);
      failed++;
    }
  }

  console.log('\n=== MDO-Nexus Service Tests ===\n');

  // OODA tests
  console.log('[OODAService]');
  const state = ooda.state();
  assert('state() returns phase', state.phase === 'observe');
  assert('state() returns tempo', state.tempo === 'operational');
  assert('state() returns cycle', state.cycle === 0);
  const adv = ooda.advance({ test: true });
  assert('advance() transitions observe->orient', adv.from === 'observe' && adv.to === 'orient');
  assert('history() records', ooda.history().length > 0);
  const tempoResult = ooda.setTempo('tactical');
  assert('setTempo() accepts valid', tempoResult.tempo === 'tactical');
  const badTempo = ooda.setTempo('invalid');
  assert('setTempo() rejects invalid', !!badTempo.error);
  const rec = ooda.recommendation();
  assert('recommendation() returns action', !!rec.action && !!rec.phase);
  ooda.reset();
  assert('reset() resets to observe', ooda.state().phase === 'observe');

  // Cybernetics tests
  console.log('\n[CyberneticsService]');
  const loop = cybernetics.startLoop(1, { test: true });
  assert('startLoop() returns cycleId', !!loop.cycleId);
  assert('startLoop() accepts numeric order', loop.order === 1);
  const loop2 = cybernetics.startLoop('second', { test: true });
  assert('startLoop() accepts string order', loop2.order === 2);
  cybernetics.recordPhase('observe', 'test', 0.8);
  cybernetics.recordPhase('orient', 'test', 0.7);
  cybernetics.recordPhase('decide', 'test', 0.9);
  cybernetics.recordPhase('act', 'test', 0.85);
  const comp = cybernetics.completeCycle(0.82, 'test feedback');
  assert('completeCycle() returns completed cycle', !!comp.completedAt);
  assert('completeCycle() has reliability', comp.reliability === 0.82);
  const cont = cybernetics.shouldContinue();
  assert('shouldContinue() returns object', typeof cont.shouldContinue === 'boolean');
  const summary = cybernetics.convergenceSummary();
  assert('convergenceSummary() has totalCycles', summary.totalCycles >= 1);
  const recursive = cybernetics.prepareRecursiveInput();
  assert('prepareRecursiveInput() returns metaQuestions', recursive && recursive.metaQuestions && recursive.metaQuestions.length > 0);

  // Synergy tests
  console.log('\n[SynergyService]');
  const mat = synergy.matrix();
  assert('matrix() returns 6x6', !!mat.INTEL && !!mat.AGENT && Object.keys(mat).length === 6);
  const fire = synergy.fire('INTEL', 'CYBER', { type: 'test' });
  assert('fire() returns from/to/strength', fire.from === 'INTEL' && fire.to === 'CYBER' && typeof fire.strength === 'number');
  const badFire = synergy.fire('INVALID', 'CYBER');
  assert('fire() rejects invalid domain', !!badFire.error);
  const amp = synergy.amplification();
  assert('amplification() returns totalEvents', typeof amp.totalEvents === 'number' && Array.isArray(amp.pairs));
  assert('history() returns events', synergy.history().length > 0);
  const val = synergy.validate();
  assert('validate() checks completeness', typeof val.valid === 'boolean' && val.connectionCount === 30);

  // Agent tests
  console.log('\n[AgentService]');
  const swarm = agent.swarmCall('observe', 'test prompt', 'T1-Fast');
  assert('swarmCall() returns result', !!swarm.result);
  assert('swarmCall() uses correct model for T1', swarm.result.model === 'haiku');
  const swarm2 = agent.swarmCall('decide', 'deep analysis');
  assert('swarmCall() auto-routes decide to T3/opus', swarm2.result.model === 'opus');
  const tf = agent.taskForce('alpha');
  assert('taskForce() creates force', tf.name === 'alpha' && tf.agents.length === 3);
  const cons = agent.consensus([{ confidence: 0.8 }, { confidence: 0.85 }, { confidence: 0.9 }]);
  assert('consensus() calculates agreement', cons.agreement === 'strong');
  assert('consensus() reaches consensus', cons.consensusReached === true);
  const route = agent.routeModel('orchestration', 'observe');
  assert('routeModel() selects higher tier', route.selected === 'opus');

  // Domain tests
  console.log('\n[DomainService]');
  const dStatus = domain.status();
  assert('status() has agent domain', !!dStatus.agent);
  assert('status() has all 6 domains', Object.keys(dStatus).length === 6);
  const resolve = domain.resolve('deploy pipeline docker');
  assert('resolve() finds infrastructure domain', resolve.domain === 'infrastructure');
  const resolve2 = domain.resolve('agent swarm consensus');
  assert('resolve() finds agent domain', resolve2.domain === 'agent');
  const health = domain.healthCheck();
  assert('healthCheck() returns allHealthy', typeof health.allHealthy === 'boolean');
  const loadResult = domain.load('agent');
  assert('load() loads known domain', loadResult.status === 'loaded');
  const badLoad = domain.load('nonexistent');
  assert('load() rejects unknown', !!badLoad.error);
  const tfs = domain.taskForces();
  assert('taskForces() returns forces', !!tfs.alpha_feature && !!tfs.foxtrot_swarm);
  const caps = domain.agentCapabilities();
  assert('agentCapabilities() returns array', Array.isArray(caps) && caps.length > 0);

  // Telemetry tests
  console.log('\n[TelemetryService]');
  const met = telemetry.metrics();
  assert('metrics() has uptime', typeof met.uptime === 'number');
  assert('metrics() has ooda state', !!met.ooda && !!met.ooda.phase);
  assert('metrics() has domains', !!met.domains);
  const snap = telemetry.snapshot();
  assert('snapshot() has phase', !!snap.phase);
  assert('snapshot() has cycle', typeof snap.cycle === 'number');

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

// --- Argument parsing ---
function parseArgs(argv) {
  const args = {};
  const positional = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      positional.push(argv[i]);
    }
  }
  args._command = positional[0] || null;
  return args;
}

// --- Main ---
const args = parseArgs(process.argv);
const command = args._command;

if (args.help || !command) {
  usage();
  process.exit(command ? 0 : 1);
}

switch (command) {
  case 'status':
    cmdStatus();
    break;
  case 'cycle':
    cmdCycle(args);
    break;
  case 'deploy':
    cmdDeploy(args);
    break;
  case 'test':
    cmdTest();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    usage();
    process.exit(1);
}
