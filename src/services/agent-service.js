'use strict';

/**
 * AgentService - Manages agent swarm operations
 * Handles tier-based routing, task force assembly, and consensus building.
 */

const TIERS = {
  'T1-Fast': { model: 'haiku', timeout: 5000, desc: 'Quick lookups, narrow checks' },
  'T2-Power': { model: 'sonnet', timeout: 15000, desc: 'Standard implementation, analysis' },
  'T3-Deep': { model: 'opus', timeout: 60000, desc: 'Architecture, deep analysis' }
};

const PHASE_TIER_MAP = {
  observe: 'T1-Fast',
  orient: 'T2-Power',
  decide: 'T3-Deep',
  act: 'T2-Power'
};

const DOMAIN_MODEL_MAP = {
  code: 'sonnet',
  orchestration: 'opus',
  data_knowledge: 'haiku',
  infrastructure: 'sonnet',
  intelligence: 'sonnet',
  agent: 'opus'
};

class AgentService {
  constructor() {
    this._taskForces = {};
    this._calls = [];
    this._consensusLog = [];
  }

  /**
   * Execute a swarm call for a given OODA phase
   * @param {string} phase - observe|orient|decide|act
   * @param {string} prompt - task prompt
   * @param {string} [tier] - T1-Fast|T2-Power|T3-Deep (auto if omitted)
   */
  swarmCall(phase, prompt, tier) {
    const phaseLower = (phase || '').toLowerCase();
    const resolvedTier = tier || PHASE_TIER_MAP[phaseLower] || 'T2-Power';
    const tierConfig = TIERS[resolvedTier] || TIERS['T2-Power'];

    const call = {
      id: `swarm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phase: phaseLower,
      prompt,
      tier: resolvedTier,
      model: tierConfig.model,
      timeout: tierConfig.timeout,
      status: 'completed',
      createdAt: Date.now(),
      completedAt: Date.now(),
      result: {
        model: tierConfig.model,
        phase: phaseLower,
        response: `[${tierConfig.model}] Processed "${prompt}" for ${phaseLower} phase`,
        confidence: this._estimateConfidence(resolvedTier),
        latencyMs: Math.floor(Math.random() * tierConfig.timeout * 0.3)
      }
    };

    this._calls.push(call);
    return call;
  }

  /**
   * Assemble or retrieve a named task force
   * @param {string} name - task force name
   */
  taskForce(name) {
    if (this._taskForces[name]) {
      return this._taskForces[name];
    }

    const force = {
      name,
      agents: [
        { role: 'lead', tier: 'T3-Deep', model: TIERS['T3-Deep'].model },
        { role: 'analyst', tier: 'T2-Power', model: TIERS['T2-Power'].model },
        { role: 'scout', tier: 'T1-Fast', model: TIERS['T1-Fast'].model }
      ],
      createdAt: Date.now(),
      status: 'ready',
      missions: 0
    };

    this._taskForces[name] = force;
    return force;
  }

  /**
   * Build consensus from multiple agent responses
   * @param {Array<{confidence: number}>} responses
   */
  consensus(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
      return { error: 'Provide an array of agent responses' };
    }

    const confidences = responses.map(r => r.confidence || 0);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const spread = Math.max(...confidences) - Math.min(...confidences);

    const result = {
      agentCount: responses.length,
      averageConfidence: parseFloat(avgConfidence.toFixed(3)),
      confidenceSpread: parseFloat(spread.toFixed(3)),
      agreement: spread < 0.2 ? 'strong' : spread < 0.4 ? 'moderate' : 'weak',
      consensusReached: avgConfidence >= 0.7 && spread < 0.3,
      ts: Date.now()
    };

    this._consensusLog.push(result);
    return result;
  }

  /**
   * Route to appropriate model based on domain and phase
   * @param {string} domain - MDO domain key
   * @param {string} phase - OODA phase
   */
  routeModel(domain, phase) {
    const domainLower = (domain || '').toLowerCase();
    const phaseLower = (phase || '').toLowerCase();
    const domainModel = DOMAIN_MODEL_MAP[domainLower] || 'sonnet';
    const phaseTier = PHASE_TIER_MAP[phaseLower] || 'T2-Power';
    const phaseModel = TIERS[phaseTier].model;

    const modelRank = { haiku: 1, sonnet: 2, opus: 3 };
    const selected = modelRank[domainModel] >= modelRank[phaseModel] ? domainModel : phaseModel;

    return {
      domain: domainLower,
      phase: phaseLower,
      domainModel,
      phaseModel,
      selected,
      tier: Object.entries(TIERS).find(([, v]) => v.model === selected)?.[0] || 'T2-Power'
    };
  }

  /** Get all swarm call history */
  callHistory() {
    return this._calls.slice();
  }

  _estimateConfidence(tier) {
    const base = { 'T1-Fast': 0.6, 'T2-Power': 0.75, 'T3-Deep': 0.9 };
    const b = base[tier] || 0.7;
    return parseFloat((b + (Math.random() * 0.1 - 0.05)).toFixed(3));
  }
}

module.exports = AgentService;
