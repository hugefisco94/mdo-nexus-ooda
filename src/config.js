/**
 * MDO Nexus OODA - Configuration
 * Clean Architecture: Infrastructure concern, injected into all layers
 */
'use strict';

const { resolve } = require('path');
const { existsSync, readFileSync } = require('fs');

// Load .env if present
const envPath = resolve(process.env.MDO_ROOT || '.', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

module.exports = {
  // ── CLI Tool Paths ──────────────────────────────────────
  codex: {
    bin: process.env.CODEX_BIN || 'codex',
    timeout: parseInt(process.env.CODEX_TIMEOUT) || 120000,
  },
  gemini: {
    bin: process.env.GEMINI_BIN || 'gemini',
    timeout: parseInt(process.env.GEMINI_TIMEOUT) || 120000,
  },
  opencode: {
    bin: process.env.OPENCODE_BIN || 'opencode-cli',
    timeout: parseInt(process.env.OPENCODE_TIMEOUT) || 120000,
  },

  // ── Claude (Sonnet 4.6 via OpenRouter) ─────────────────
  claude: {
    url: process.env.CLAUDE_URL || 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'anthropic/claude-sonnet-4-6',
    timeout: parseInt(process.env.CLAUDE_TIMEOUT) || 120000,
  },

  // ── DO GPU MI300X (vLLM + openfang + OpenManus) ────────
  gpu: {
    host: process.env.GPU_HOST || '129.212.185.133',
    apiKey: process.env.GPU_API_KEY || 'sk-do-vllm-2026',
    defaultModel: process.env.GPU_MODEL || '72b',
    timeout: parseInt(process.env.GPU_TIMEOUT) || 60000,
    openfangPort: parseInt(process.env.OPENFANG_PORT) || 4200,
  },

  // ── Elice Cloud (legacy, fallback to GPU) ─────────────
  elice: {
    url: process.env.ELICE_URL || 'http://localhost:8100',
    apiKey: process.env.ELICE_API_KEY || 'sk-elice-litellm-key',
    defaultModel: process.env.ELICE_MODEL || 'swarm/gemini-flash',
    timeout: parseInt(process.env.ELICE_TIMEOUT) || 60000,
  },

  // ── Harness.io ──────────────────────────────────────────
  harness: {
    baseUrl: 'https://app.harness.io',
    pat: process.env.HARNESS_PAT || '',
    account: process.env.HARNESS_ACCOUNT || 'u78286qpSgu9QDJX0SgHUg',
    org: process.env.HARNESS_ORG || 'default',
    project: process.env.HARNESS_PROJECT || 'default_project',
    pipelineId: process.env.HARNESS_PIPELINE || 'deploy_ai_orchestration_hub',
  },

  // ── OODA Defaults ───────────────────────────────────────
  ooda: {
    defaultTempo: 'operational',
    phases: ['observe', 'orient', 'decide', 'act'],
  },

  // ── MDO Domain → Adapter Routing (GPU-optimized) ──────
  routing: {
    observe:  { adapter: 'gpu',     model: '72b',     reason: 'Deep recon with 72B FP8 (7B offline, single-model maximized)' },
    orient:   { adapter: 'gpu',     model: '72b',     reason: 'Deep analysis with 72B FP8' },
    decide:   { adapter: 'claude',  model: 'claude-sonnet-4-6', reason: 'Strategic planning via Claude Sonnet 4.6 max' },
    act:      { adapter: 'gpu',     model: '72b',     reason: 'Execution via GPU 72B' },
  },

  // ── OpenRouter (direct API, lightweight swarm) ─────────
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    timeout: parseInt(process.env.OPENROUTER_TIMEOUT) || 60000,
  },

  // ── Swarm Tiers (GPU-first → OpenRouter → Elice fallback) ─
  swarm: {
    t0_gpu: [
      'gpu/7b',
      'gpu/pixtral',
    ],
    t1_fast: [
      'gpu/72b',
      'or/gemini-flash',
      'or/gemini3-flash',
      'or/qwen3-coder',
      'or/mistral-small',
    ],
    t2_power: [
      'or/claude-haiku',
      'or/gemini-pro',
      'or/deepseek-v3',
      'or/qwen3-235b',
    ],
    t3_deep: [
      'or/deepseek-r1',
      'or/claude-sonnet',
    ],
  },
};
