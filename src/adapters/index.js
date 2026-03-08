/**
 * Adapter Registry - Factory for all adapters
 * Clean Architecture: Adapter Layer (composition root)
 */
'use strict';

const { CodexAdapter } = require('./codex');
const { GeminiAdapter } = require('./gemini');
const { OpenCodeAdapter } = require('./opencode');
const { EliceAdapter } = require('./elice');
const { HarnessAdapter } = require('./harness');
const { GpuAdapter } = require('./gpu');
const { ClaudeAdapter } = require('./claude');
const { OpenRouterAdapter } = require('./openrouter');

/**
 * Create and return all adapters as a Map.
 * GPU + Claude + OpenRouter registered first (highest priority).
 */
function createAdapters(config) {
  const map = new Map();
  map.set('gpu', new GpuAdapter(config));
  map.set('claude', new ClaudeAdapter(config));
  map.set('openrouter', new OpenRouterAdapter(config));
  map.set('codex', new CodexAdapter(config));
  map.set('gemini', new GeminiAdapter(config));
  map.set('opencode', new OpenCodeAdapter(config));
  map.set('elice', new EliceAdapter(config));
  map.set('harness', new HarnessAdapter(config));
  return map;
}

/** Probe all adapters in parallel, return status summary */
async function probeAll(adapters) {
  const entries = [...adapters.entries()];
  const results = await Promise.allSettled(entries.map(([, a]) => a.probe()));
  return entries.map(([name, adapter], i) => ({
    name,
    available: adapter.available,
    result: results[i].status === 'fulfilled' ? results[i].value : { ok: false, error: results[i].reason?.message },
  }));
}

module.exports = { createAdapters, probeAll };
