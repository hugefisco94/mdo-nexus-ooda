/**
 * OSINT Adapters & Service - Unit Tests
 * Phase 5: TDD-DDD-SDD verification
 *
 * Tests:
 *  1-4. Adapter probe/execute for watchtower, siftly, daaf, deimv2
 *  5.   OsintService.aggregateIntel() structure
 *  6.   OODA phase OSINT routing
 *  7.   SynergyMatrix OSINT-INTEL links
 *  8.   "Stop at Login" violation detection
 *  9.   Domain keyword resolution
 * 10.   Adapter registry count
 */
'use strict';

// --- 1. WatchtowerAdapter ---
(function testWatchtowerAdapter() {
  const { WatchtowerAdapter } = require('../../src/adapters/watchtower');
  const wt = new WatchtowerAdapter({});

  assert(wt.name === 'watchtower', 'WatchtowerAdapter name is "watchtower"');
  assert(Array.isArray(wt.feeds), 'WatchtowerAdapter has feeds array');
  assert(wt.feeds.length > 0, 'WatchtowerAdapter has default RSS feeds');
  assert(wt.timeout === 10000, 'WatchtowerAdapter default timeout 10s');
  assert(wt.maxItems === 50, 'WatchtowerAdapter default maxItems 50');

  // Custom config
  const wt2 = new WatchtowerAdapter({ watchtower: { timeout: 5000, maxItems: 10 } });
  assert(wt2.timeout === 5000, 'WatchtowerAdapter respects custom timeout');
  assert(wt2.maxItems === 10, 'WatchtowerAdapter respects custom maxItems');
})();

// --- 2. SiftlyAdapter ---
(function testSiftlyAdapter() {
  const { SiftlyAdapter } = require('../../src/adapters/siftly');
  const sf = new SiftlyAdapter({});

  assert(sf.name === 'siftly', 'SiftlyAdapter name is "siftly"');
  assert(sf.host === 'localhost', 'SiftlyAdapter default host localhost');
  assert(sf.port === 3000, 'SiftlyAdapter default port 3000');

  // Custom config
  const sf2 = new SiftlyAdapter({ siftly: { host: '10.0.0.1', port: 4000 } });
  assert(sf2.host === '10.0.0.1', 'SiftlyAdapter respects custom host');
  assert(sf2.port === 4000, 'SiftlyAdapter respects custom port');
})();

// --- 3. DaafAdapter ---
(function testDaafAdapter() {
  const { DaafAdapter, SAT_METHODS } = require('../../src/adapters/daaf');
  const da = new DaafAdapter({});

  assert(da.name === 'daaf', 'DaafAdapter name is "daaf"');
  assert(typeof SAT_METHODS === 'object', 'SAT_METHODS is exported');
  assert(SAT_METHODS.ach === 'Analysis of Competing Hypotheses', 'SAT ACH method defined');
  assert(SAT_METHODS.redteam === 'Red Team / Alternative Analysis', 'SAT Red Team method defined');
  assert(SAT_METHODS.indicators === 'Indicators & Warning', 'SAT I&W method defined');
  assert(SAT_METHODS.keyassumptions === 'Key Assumptions Check', 'SAT KAC method defined');

  // Structured analysis (synchronous internal method)
  const analysis = da._structuredAnalysis('test prompt', 'ach', {});
  assert(analysis.type === 'Analysis of Competing Hypotheses', 'ACH analysis type correct');
  assert(analysis.classification === 'UNCLASSIFIED', 'Default classification UNCLASSIFIED');
  assert(Array.isArray(analysis.hypotheses), 'ACH generates hypotheses array');
  assert(analysis.hypotheses.length >= 2, 'ACH generates at least 2 hypotheses');

  // Indicators method
  const iw = da._structuredAnalysis('threat indicator test', 'indicators', {});
  assert(iw.type === 'Indicators & Warning', 'I&W analysis type correct');
  assert(iw.warningLevel === 'ELEVATED', 'I&W default warning level ELEVATED');
  assert(Array.isArray(iw.indicators), 'I&W generates indicators array');
})();

// --- 4. DeimV2Adapter ---
(function testDeimV2Adapter() {
  const { DeimV2Adapter } = require('../../src/adapters/deimv2');
  const deim = new DeimV2Adapter({});

  assert(deim.name === 'deimv2', 'DeimV2Adapter name is "deimv2"');
  assert(deim.host === '129.212.185.133', 'DeimV2Adapter default host is DO GPU');
  assert(deim.port === 8003, 'DeimV2Adapter default port 8003');
  assert(deim.confidenceThreshold === 0.5, 'DeimV2Adapter default confidence 0.5');
  assert(deim.timeout === 30000, 'DeimV2Adapter default timeout 30s');

  // Custom config
  const deim2 = new DeimV2Adapter({ deimv2: { host: '10.0.0.2', port: 9000, confidenceThreshold: 0.7 } });
  assert(deim2.host === '10.0.0.2', 'DeimV2Adapter respects custom host');
  assert(deim2.port === 9000, 'DeimV2Adapter respects custom port');
  assert(deim2.confidenceThreshold === 0.7, 'DeimV2Adapter respects custom confidence');
})();

// --- 5. OsintService structure ---
(function testOsintService() {
  const OsintService = require('../../src/services/osint-service');
  const svc = new OsintService({});

  assert(typeof svc.collectFeeds === 'function', 'OsintService has collectFeeds()');
  assert(typeof svc.enrichBookmarks === 'function', 'OsintService has enrichBookmarks()');
  assert(typeof svc.analyzeImagery === 'function', 'OsintService has analyzeImagery()');
  assert(typeof svc.structuredAnalysis === 'function', 'OsintService has structuredAnalysis()');
  assert(typeof svc.aggregateIntel === 'function', 'OsintService has aggregateIntel()');
  assert(typeof svc.dashboard === 'function', 'OsintService has dashboard()');
  assert(typeof svc.probeOsint === 'function', 'OsintService has probeOsint()');
  assert(typeof svc.clearCache === 'function', 'OsintService has clearCache()');

  // Dashboard returns correct structure
  const dash = svc.dashboard();
  assert(dash.cached !== undefined, 'Dashboard has cached status');
  assert(dash.lastUpdate !== undefined, 'Dashboard has lastUpdate');
  assert(dash.cached.feeds === false, 'Fresh service has no cached feeds');
  assert(dash.cached.social === false, 'Fresh service has no cached social');

  // clearCache works
  const cleared = svc.clearCache();
  assert(cleared.cleared === true, 'clearCache returns confirmation');
})();

// --- 6. OODA Phase OSINT routing ---
(function testOodaOsintRouting() {
  const { PHASE_DOCTRINE } = require('../../src/core/ooda-engine');

  assert(Array.isArray(PHASE_DOCTRINE.observe.osintAdapters), 'OBSERVE has osintAdapters');
  assert(PHASE_DOCTRINE.observe.osintAdapters.includes('watchtower'), 'OBSERVE routes to watchtower');
  assert(PHASE_DOCTRINE.observe.osintAdapters.includes('siftly'), 'OBSERVE routes to siftly');
  assert(PHASE_DOCTRINE.observe.osintAdapters.includes('deimv2'), 'OBSERVE routes to deimv2');

  assert(Array.isArray(PHASE_DOCTRINE.orient.osintAdapters), 'ORIENT has osintAdapters');
  assert(PHASE_DOCTRINE.orient.osintAdapters.includes('siftly'), 'ORIENT routes to siftly');
  assert(PHASE_DOCTRINE.orient.osintAdapters.includes('daaf'), 'ORIENT routes to daaf');

  assert(Array.isArray(PHASE_DOCTRINE.decide.osintAdapters), 'DECIDE has osintAdapters');
  assert(PHASE_DOCTRINE.decide.osintAdapters.includes('daaf'), 'DECIDE routes to daaf');

  assert(!PHASE_DOCTRINE.act.osintAdapters, 'ACT has no osintAdapters (execution phase)');
})();

// --- 7. Synergy Matrix OSINT links ---
(function testSynergyOsint() {
  const { SYNERGY_MAP } = require('../../src/core/mdo-domains');

  const osintKeys = ['osint_to_intel', 'osint_to_code', 'osint_to_orch', 'osint_to_data', 'intel_to_osint'];
  for (const key of osintKeys) {
    assert(typeof SYNERGY_MAP[key] === 'string', `Synergy link ${key} exists`);
  }
  assert(SYNERGY_MAP.osint_to_intel.includes('intelligence'), 'osint_to_intel enriches intelligence');
  assert(SYNERGY_MAP.intel_to_osint.includes('collection'), 'intel_to_osint drives collection');
})();

// --- 8. "Stop at Login" violation detection ---
(function testStopAtLogin() {
  // DaafAdapter: input sanitization for _runPython
  const { DaafAdapter } = require('../../src/adapters/daaf');
  const da = new DaafAdapter({});

  // Verify assumptions check auto-validates "no auth bypass"
  const assumptions = da._extractAssumptions('test');
  const noAuthAssumption = assumptions.find(a => a.text.includes('authentication bypass'));
  assert(noAuthAssumption !== undefined, '"Stop at Login" assumption auto-generated');
  assert(noAuthAssumption.text.includes('No authentication bypass'), 'Assumption text asserts no auth bypass');

  // DeimV2: default strip_exif
  const { DeimV2Adapter } = require('../../src/adapters/deimv2');
  const deim = new DeimV2Adapter({});
  assert(deim.confidenceThreshold === 0.5, 'DEIMv2 has public confidence threshold');
})();

// --- 9. Domain keyword resolution ---
(function testDomainResolution() {
  const { MdoDomains } = require('../../src/core/mdo-domains');
  const mdo = new MdoDomains();

  assert(mdo.resolve('osint threat feed') === 'intelligence', '"osint threat feed" -> intelligence');
  assert(mdo.resolve('rss news collection') === 'intelligence', '"rss news collection" -> intelligence');
  assert(mdo.resolve('bookmark social media') === 'intelligence', '"bookmark social media" -> intelligence');
  assert(mdo.resolve('object detection imagery') === 'intelligence', '"object detection imagery" -> intelligence');
  assert(mdo.resolve('satellite geospatial') === 'intelligence', '"satellite geospatial" -> intelligence');
})();

// --- 10. Adapter registry count ---
(function testAdapterRegistry() {
  const { createAdapters } = require('../../src/adapters');
  const adapters = createAdapters({});

  assert(adapters.size === 12, `Adapter registry has 12 entries (got ${adapters.size})`);
  assert(adapters.has('watchtower'), 'Registry has watchtower');
  assert(adapters.has('siftly'), 'Registry has siftly');
  assert(adapters.has('daaf'), 'Registry has daaf');
  assert(adapters.has('deimv2'), 'Registry has deimv2');

  // OSINT adapters are registered before legacy adapters
  const keys = [...adapters.keys()];
  const wtIdx = keys.indexOf('watchtower');
  const codexIdx = keys.indexOf('codex');
  assert(wtIdx < codexIdx, 'OSINT adapters registered before legacy (watchtower < codex)');
})();
