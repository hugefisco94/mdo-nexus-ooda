/**
 * MDO-Nexus-OODA Dashboard
 * Main application initialization
 */

(function() {
  'use strict';

  const DATA_FILES = {
    domains: 'data/domains.json',
    synergy: 'data/synergy-matrix.json',
    ooda: 'data/ooda-state.json',
    cybernetics: 'data/cybernetics-state.json',
    health: 'data/health.json',
    tests: 'data/test-results.json'
  };

  const REFRESH_INTERVAL = 30000; // 30 seconds

  let state = {
    data: {},
    vizInstances: {},
    refreshTimer: null,
    lastRefresh: null
  };

  /** Fetch a JSON file with error handling */
  async function loadJSON(url) {
    try {
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return await resp.json();
    } catch (err) {
      console.warn('[MDO] Failed to load ' + url + ':', err.message);
      return null;
    }
  }

  /** Load all data files in parallel */
  async function loadAllData() {
    const entries = Object.entries(DATA_FILES);
    const results = await Promise.allSettled(
      entries.map(([key, url]) => loadJSON(url).then(data => [key, data]))
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const [key, data] = result.value;
        if (data) state.data[key] = data;
      }
    }

    state.lastRefresh = new Date();
    return state.data;
  }

  /** Initialize all visualizations */
  function initVisualizations() {
    // 1. OODA Ring
    if (state.data.ooda && window.OODAViz) {
      state.vizInstances.ooda = new OODAViz('oodaCanvas', state.data.ooda);
    }

    // 2. Cybernetics Chart
    if (state.data.cybernetics && window.CyberneticsViz) {
      state.vizInstances.cybernetics = new CyberneticsViz('cyberneticsCanvas', state.data.cybernetics);
      state.vizInstances.cybernetics.updateStats();
    }

    // 3. Synergy Matrix
    if (state.data.synergy && window.SynergyViz) {
      state.vizInstances.synergy = new SynergyViz('synergyContainer', state.data.synergy);
    }

    // 4. Domain Cards
    if (state.data.domains && window.DomainViz) {
      state.vizInstances.domains = new DomainViz('domainsContainer', state.data.domains);
    }

    // 5. Feedback Loop
    if (state.data.cybernetics && window.FeedbackViz) {
      state.vizInstances.feedback = new FeedbackViz('feedbackCanvas', state.data.cybernetics);
    }

    // 6. Cycle Tracker
    if (state.data.cybernetics && window.CycleTrackerViz) {
      state.vizInstances.tracker = new CycleTrackerViz(
        'trackerContainer',
        state.data.cybernetics,
        state.data.tests
      );
    }

    // Footer health indicators
    updateHealthIndicators();
  }

  /** Update footer connection status */
  function updateHealthIndicators() {
    const health = state.data.health;
    if (!health || !health.services) return;

    const container = document.getElementById('footerStatus');
    if (!container) return;

    container.innerHTML = '';

    const keyServices = ['do-gpu', 'litellm', 'harness'];
    for (const svc of health.services) {
      if (!keyServices.includes(svc.id)) continue;

      const indicator = document.createElement('div');
      indicator.className = 'status-indicator';

      const dot = document.createElement('span');
      dot.className = 'status-dot ' + (svc.status === 'online' ? 'online' : 'offline');

      const label = document.createElement('span');
      label.textContent = svc.name;

      indicator.appendChild(dot);
      indicator.appendChild(label);
      container.appendChild(indicator);
    }

    // Last refresh
    const refresh = document.createElement('div');
    refresh.className = 'status-indicator';
    refresh.style.marginLeft = '1rem';
    refresh.innerHTML = '<span style="color:var(--text-dim);font-size:.6rem">Last refresh: ' +
      new Date().toLocaleTimeString() + '</span>';
    container.appendChild(refresh);
  }

  /** Auto-refresh cycle */
  function startAutoRefresh() {
    if (state.refreshTimer) clearInterval(state.refreshTimer);

    state.refreshTimer = setInterval(async () => {
      await loadAllData();
      updateHealthIndicators();

      // Update dynamic elements
      if (state.vizInstances.cybernetics) {
        state.vizInstances.cybernetics.updateStats();
      }
    }, REFRESH_INTERVAL);
  }

  /** Handle window resize */
  function handleResize() {
    let timeout;
    window.addEventListener('resize', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (state.vizInstances.ooda) state.vizInstances.ooda.resize();
        if (state.vizInstances.cybernetics) state.vizInstances.cybernetics.resize();
        if (state.vizInstances.feedback) state.vizInstances.feedback.resize();
      }, 200);
    });
  }

  /** Register Service Worker */
  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function(err) {
        console.warn('[MDO] SW registration failed:', err.message);
      });
    }
  }

  /** Main initialization */
  async function init() {
    console.log('[MDO] Initializing MDO-Nexus-OODA Dashboard...');

    await loadAllData();
    initVisualizations();
    startAutoRefresh();
    handleResize();
    registerSW();

    console.log('[MDO] Dashboard ready. Data keys:', Object.keys(state.data));
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
