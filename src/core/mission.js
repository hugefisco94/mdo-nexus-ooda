/**
 * Mission Manager - Mission Lifecycle Tracking
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * Refactored from mdo-api-server/server.js mission endpoints.
 * Each mission tracks its own OODA phase independently.
 */
'use strict';

const STATUSES = ['planning', 'observing', 'orienting', 'deciding', 'executing', 'complete', 'failed'];

class MissionManager {
  constructor(ooda, domains) {
    this.ooda = ooda;
    this.domains = domains;
    this.missions = [];
    this.idCounter = 0;
  }

  /** Create a new mission */
  create({ intent, taskForce = 'alpha_feature', domainIds = ['code'] }) {
    const tf = this.domains.taskForce(taskForce);
    const mission = {
      id: `M-${++this.idCounter}`,
      intent,
      taskForce,
      status: 'planning',
      oodaPhase: 'observe',
      domains: domainIds,
      agents: tf ? tf.agents : [],
      commander: tf ? tf.commander : 'executor',
      createdAt: new Date().toISOString(),
      completedAt: null,
      results: [],
    };
    this.missions.push(mission);
    return mission;
  }

  /** Advance a mission's OODA phase */
  advance(id, result = null) {
    const m = this.get(id);
    if (!m) return null;

    const phases = ['observe', 'orient', 'decide', 'act'];
    const idx = phases.indexOf(m.oodaPhase);
    if (result) m.results.push({ phase: m.oodaPhase, result, at: new Date().toISOString() });

    if (idx < phases.length - 1) {
      m.oodaPhase = phases[idx + 1];
      m.status = ['observing', 'orienting', 'deciding', 'executing'][idx + 1];
    } else {
      m.status = 'complete';
      m.completedAt = new Date().toISOString();
    }
    return m;
  }

  /** Get mission by ID */
  get(id) {
    return this.missions.find(m => m.id === id) || null;
  }

  /** List all missions */
  list(filter = null) {
    if (!filter) return [...this.missions];
    return this.missions.filter(m => m.status === filter);
  }

  /** Get active (non-terminal) missions */
  active() {
    return this.missions.filter(m => !['complete', 'failed'].includes(m.status));
  }

  /** Mark mission as failed */
  fail(id, reason) {
    const m = this.get(id);
    if (m) {
      m.status = 'failed';
      m.completedAt = new Date().toISOString();
      m.results.push({ phase: m.oodaPhase, result: `FAILED: ${reason}`, at: m.completedAt });
    }
    return m;
  }
}

module.exports = { MissionManager, STATUSES };
