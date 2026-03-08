/**
 * MDO Domains - Multi-Domain Operations Configuration
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * Migrated from mdo-command-center with AGENT domain extension.
 * 6 operational domains mapped to software development operations.
 */
'use strict';

const DOMAIN_DEFS = {
  code: {
    label: 'Code Operations',
    agents: ['executor', 'build-fixer', 'test-engineer'],
    description: 'Source code creation, modification, testing',
    adapters: ['gpu', 'codex', 'opencode'],
    gpuModel: '72b',
  },
  orchestration: {
    label: 'Orchestration',
    agents: ['architect', 'planner', 'analyst', 'critic'],
    description: 'Architecture decisions, planning, coordination',
    adapters: ['gpu', 'gemini', 'codex'],
    gpuModel: '72b',
  },
  data_knowledge: {
    label: 'Data & Knowledge',
    agents: ['scientist', 'document-specialist', 'explore'],
    description: 'Research, documentation, knowledge management',
    adapters: ['gpu', 'gemini', 'elice'],
    gpuModel: '7b',
  },
  infrastructure: {
    label: 'Infrastructure',
    agents: ['devops', 'docker', 'harness'],
    description: 'CI/CD, cloud, deployment, infrastructure',
    adapters: ['codex', 'harness', 'gpu'],
    gpuModel: '7b',
  },
  intelligence: {
    label: 'Intelligence',
    agents: ['security-reviewer', 'debugger', 'qa-tester'],
    description: 'Security analysis, debugging, quality assurance',
    adapters: ['gpu', 'codex', 'gemini'],
    gpuModel: '72b',
  },
  agent: {
    label: 'Agent Operations',
    agents: ['agent-manager', 'swarm-coordinator', 'model-router'],
    description: 'Agent lifecycle management, swarm consensus, model routing, task force composition',
    adapters: ['gpu', 'claude', 'openrouter'],
    gpuModel: '72b',
    capabilities: ['agent-lifecycle', 'swarm-consensus', 'model-routing', 'task-force-composition'],
  },
};

const TASK_FORCES = {
  alpha_feature: {
    commander: 'architect',
    agents: ['planner', 'executor', 'test-engineer', 'verifier'],
    mission: 'deliberate_attack',
    description: 'New feature development',
  },
  bravo_incident: {
    commander: 'debugger',
    agents: ['explore', 'build-fixer', 'executor', 'qa-tester'],
    mission: 'hasty_defense',
    description: 'Bug investigation and fix',
  },
  charlie_knowledge: {
    commander: 'scientist',
    agents: ['document-specialist', 'explore', 'writer'],
    mission: 'intelligence_prep',
    description: 'Research and documentation',
  },
  delta_security: {
    commander: 'security-reviewer',
    agents: ['debugger', 'qa-tester', 'code-reviewer'],
    mission: 'area_defense',
    description: 'Security audit and hardening',
  },
  echo_platform: {
    commander: 'build-fixer',
    agents: ['executor', 'verifier'],
    mission: 'stability_ops',
    description: 'Platform maintenance and stability',
  },
  foxtrot_swarm: {
    commander: 'agent-manager',
    agents: ['swarm-coordinator', 'model-router', 'executor', 'verifier'],
    mission: 'swarm_ops',
    description: 'Multi-agent swarm coordination and consensus',
  },
};

const SYNERGY_MAP = {
  code_to_data:    'Store patterns after implementation',
  data_to_code:    'Enrich context with RAG before coding',
  intel_to_code:   'Security scan triggers vulnerability fix',
  orch_to_infra:   'Scale decisions trigger resource allocation',
  infra_to_orch:   'Health status adjusts operational tempo',
  agent_to_code:   'Agent orchestration triggers code execution',
  agent_to_intel:  'Agent consensus validates intelligence assessments',
  agent_to_orch:   'Swarm routing informs orchestration decisions',
  agent_to_data:   'Agent findings feed knowledge base',
  agent_to_infra:  'Model routing drives infrastructure scaling',
};

class MdoDomains {
  constructor() {
    this.domains = {};
    for (const [id, def] of Object.entries(DOMAIN_DEFS)) {
      this.domains[id] = { ...def, status: 'active', load: 0 };
    }
  }

  /** Get all domain statuses */
  status() {
    return Object.fromEntries(
      Object.entries(this.domains).map(([k, v]) => [k, { status: v.status, load: v.load }])
    );
  }

  /** Resolve which domain should handle a task by keyword analysis */
  resolve(input) {
    const text = input.toLowerCase();
    const scores = {};
    const keywords = {
      code:           ['code', 'implement', 'build', 'fix', 'refactor', '구현', '코드', '빌드', '수정'],
      orchestration:  ['plan', 'architect', 'design', 'strategy', '설계', '계획', '아키텍처', '전략'],
      data_knowledge: ['research', 'search', 'document', 'analyze', '연구', '검색', '문서', '분석'],
      infrastructure: ['deploy', 'pipeline', 'docker', 'ci', 'cd', '배포', '인프라', '파이프라인'],
      intelligence:   ['security', 'debug', 'test', 'audit', 'vulnerability', '보안', '디버그', '테스트', '취약점'],
      agent:          ['agent', 'swarm', 'consensus', 'routing', 'lifecycle', '에이전트', '스웜', '합의', '라우팅'],
    };

    for (const [domain, words] of Object.entries(keywords)) {
      scores[domain] = words.filter(w => text.includes(w)).length;
    }

    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    return best[1] > 0 ? best[0] : 'code'; // default to code domain
  }

  /** Get recommended adapter for a domain */
  adapterFor(domain) {
    const d = this.domains[domain];
    return d ? d.adapters[0] : 'codex';
  }

  /** Get task force by name */
  taskForce(name) {
    return TASK_FORCES[name] || null;
  }

  /** List all task forces */
  taskForces() {
    return { ...TASK_FORCES };
  }

  /** Get synergy map */
  synergies() {
    return { ...SYNERGY_MAP };
  }

  /** Increment load on a domain */
  addLoad(domain) {
    if (this.domains[domain]) this.domains[domain].load++;
  }

  /** Get agent domain capabilities */
  agentCapabilities() {
    return DOMAIN_DEFS.agent.capabilities.slice();
  }
}

module.exports = { MdoDomains, DOMAIN_DEFS, TASK_FORCES, SYNERGY_MAP };
