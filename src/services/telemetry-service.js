'use strict';

/**
 * TelemetryService - Aggregates all service metrics for dashboard
 * Provides metrics snapshots and SSE streaming.
 */

const OODAService = require('./ooda-service');
const CyberneticsService = require('./cybernetics-service');
const SynergyService = require('./synergy-service');
const AgentService = require('./agent-service');
const DomainService = require('./domain-service');

class TelemetryService {
  constructor(services) {
    this._ooda = (services && services.ooda) || new OODAService();
    this._cyber = (services && services.cybernetics) || new CyberneticsService();
    this._synergy = (services && services.synergy) || new SynergyService();
    this._agent = (services && services.agent) || new AgentService();
    this._domain = (services && services.domain) || new DomainService();
    this._startedAt = Date.now();
    this._sseClients = new Set();
  }

  /** Full metrics aggregation */
  metrics() {
    return {
      uptime: Date.now() - this._startedAt,
      ts: Date.now(),
      ooda: this._ooda.state(),
      convergence: this._cyber.convergenceSummary(),
      synergy: this._synergy.amplification(),
      domains: this._domain.status(),
      health: this._domain.healthCheck()
    };
  }

  /** Lightweight snapshot for polling */
  snapshot() {
    const convergence = this._cyber.convergenceSummary();
    return {
      ts: Date.now(),
      uptime: Date.now() - this._startedAt,
      phase: this._ooda.state().phase,
      cycle: this._ooda.state().cycle,
      convergence: convergence.finalReliability || 0,
      converged: convergence.converged || false,
      domainHealth: this._domain.healthCheck().allHealthy,
      synergyEvents: this._synergy.history().length,
      sseClients: this._sseClients.size
    };
  }

  /** Server-Sent Events stream */
  stream(res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Send initial snapshot
    res.write(`data: ${JSON.stringify(this.snapshot())}\n\n`);

    this._sseClients.add(res);

    // Heartbeat + metrics every 2 seconds
    const interval = setInterval(() => {
      try {
        res.write(`data: ${JSON.stringify(this.snapshot())}\n\n`);
      } catch (e) {
        clearInterval(interval);
        this._sseClients.delete(res);
      }
    }, 2000);

    res.on('close', () => {
      clearInterval(interval);
      this._sseClients.delete(res);
    });
  }

  /** Broadcast an event to all SSE clients */
  broadcast(eventName, data) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this._sseClients) {
      try { client.write(payload); } catch (e) { this._sseClients.delete(client); }
    }
  }
}

module.exports = TelemetryService;
