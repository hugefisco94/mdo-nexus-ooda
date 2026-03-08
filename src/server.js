'use strict';

const path = require('path');
const express = require('express');
const cors = require('cors');

const OODAService = require('./services/ooda-service');
const CyberneticsService = require('./services/cybernetics-service');
const SynergyService = require('./services/synergy-service');
const AgentService = require('./services/agent-service');
const DomainService = require('./services/domain-service');
const TelemetryService = require('./services/telemetry-service');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Static files (project root: index.html, css/, js/, data/) ---
const projectRoot = path.resolve(__dirname, '..');
app.use(express.static(projectRoot));

// --- Services ---
const ooda = new OODAService();
const cybernetics = new CyberneticsService();
const synergy = new SynergyService();
const agent = new AgentService();
const domain = new DomainService();
const telemetry = new TelemetryService({ ooda, cybernetics, synergy, agent, domain });

// --- Routes ---

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    ts: Date.now(),
    services: {
      ooda: 'active',
      cybernetics: 'active',
      synergy: 'active',
      agent: 'active',
      domain: 'active',
      telemetry: 'active'
    }
  });
});

// Aggregated metrics
app.get('/api/metrics', (req, res) => {
  try {
    res.json(telemetry.metrics());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// OODA state and operations
app.get('/api/ooda', (req, res) => {
  try {
    res.json({
      state: ooda.state(),
      recommendation: ooda.recommendation(),
      history: ooda.history()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ooda/advance', (req, res) => {
  try {
    res.json(ooda.advance(req.body));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ooda/tempo', (req, res) => {
  try {
    res.json(ooda.setTempo(req.body.tempo));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/ooda/reset', (req, res) => {
  try {
    res.json(ooda.reset());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Synergy matrix
app.get('/api/synergy', (req, res) => {
  try {
    res.json({
      matrix: synergy.matrix(),
      amplification: synergy.amplification(),
      validation: synergy.validate()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/synergy/fire', (req, res) => {
  try {
    const { from, to, event } = req.body;
    res.json(synergy.fire(from, to, event));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Domains
app.get('/api/domains', (req, res) => {
  try {
    res.json({
      status: domain.status(),
      taskForces: domain.taskForces(),
      synergies: domain.synergies(),
      agentCapabilities: domain.agentCapabilities()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/domains/health', (req, res) => {
  try {
    res.json(domain.healthCheck());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/domains/resolve', (req, res) => {
  try {
    res.json(domain.resolve(req.body.input || ''));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cybernetics
app.get('/api/cybernetics', (req, res) => {
  try {
    res.json({
      convergence: cybernetics.convergenceSummary(),
      shouldContinue: cybernetics.shouldContinue()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cybernetics/start', (req, res) => {
  try {
    const { order, input } = req.body;
    res.json(cybernetics.startLoop(order || 1, input));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cybernetics/record', (req, res) => {
  try {
    const { phase, result, confidence } = req.body;
    res.json(cybernetics.recordPhase(phase, result, confidence));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/cybernetics/complete', (req, res) => {
  try {
    const { reliability, feedback } = req.body;
    res.json(cybernetics.completeCycle(reliability, feedback));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Agent operations
app.post('/api/agent/swarm', (req, res) => {
  try {
    const { phase, prompt, tier } = req.body;
    res.json(agent.swarmCall(phase, prompt, tier));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/agent/route', (req, res) => {
  try {
    const { domain: d, phase } = req.query;
    res.json(agent.routeModel(d, phase));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/agent/consensus', (req, res) => {
  try {
    res.json(agent.consensus(req.body.responses || []));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SSE stream
app.get('/api/stream', (req, res) => {
  telemetry.stream(res);
});

// --- Start ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[MDO-Nexus-OODA] Server running on http://localhost:${PORT}`);
    console.log(`[MDO-Nexus-OODA] Health: http://localhost:${PORT}/health`);
    console.log(`[MDO-Nexus-OODA] Metrics: http://localhost:${PORT}/api/metrics`);
    console.log(`[MDO-Nexus-OODA] Stream: http://localhost:${PORT}/api/stream`);
  });
}

module.exports = app;
