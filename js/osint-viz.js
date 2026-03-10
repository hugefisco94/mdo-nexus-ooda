/**
 * OSINT Visualization - 7th Canvas for PWA Dashboard
 * Displays threat heatmap, entity graph, detection overlay.
 */
(function() {
  'use strict';

  var THREAT_COLORS = {
    CRITICAL: '#ff1744',
    HIGH: '#ff9100',
    MEDIUM: '#ffea00',
    LOW: '#00e676',
    INFO: '#448aff',
  };

  function OsintViz(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this._data = { feeds: null, social: null, imagery: null, analysis: null };
    this._buildUI();
  }

  OsintViz.prototype._buildUI = function() {
    this.container.innerHTML = '';

    var summary = document.createElement('div');
    summary.className = 'osint-summary';
    summary.id = 'osintSummary';
    summary.innerHTML = '<span>OSINT: Awaiting data...</span>';

    var threatPanel = document.createElement('div');
    threatPanel.className = 'osint-panel osint-threats';
    threatPanel.innerHTML = '<h3>Threat Feeds</h3><div id="osintThreatList" class="osint-list"></div>';

    var socialPanel = document.createElement('div');
    socialPanel.className = 'osint-panel osint-social';
    socialPanel.innerHTML = '<h3>Social OSINT</h3><div id="osintSocialList" class="osint-list"></div>';

    var imageryPanel = document.createElement('div');
    imageryPanel.className = 'osint-panel osint-imagery';
    imageryPanel.innerHTML = '<h3>Imagery Detection</h3><canvas id="osintImageryCanvas" width="300" height="200"></canvas>';

    var analysisPanel = document.createElement('div');
    analysisPanel.className = 'osint-panel osint-analysis';
    analysisPanel.innerHTML = '<h3>Structured Analysis</h3><div id="osintAnalysisContent" class="osint-content"></div>';

    this.container.appendChild(summary);
    this.container.appendChild(threatPanel);
    this.container.appendChild(socialPanel);
    this.container.appendChild(imageryPanel);
    this.container.appendChild(analysisPanel);
  };

  OsintViz.prototype.update = function(data) {
    if (!this.container) return;
    this._data = data || this._data;
    this._renderThreats();
    this._renderSocial();
    this._renderAnalysis();
    this._renderSummary();
  };

  OsintViz.prototype._renderThreats = function() {
    var list = document.getElementById('osintThreatList');
    if (!list || !this._data.feeds || !this._data.feeds.items) {
      if (list) list.innerHTML = '<div class="osint-empty">No feeds cached</div>';
      return;
    }
    var items = this._data.feeds.items.slice(0, 15);
    list.innerHTML = items.map(function(item) {
      var color = THREAT_COLORS[item.threatLevel] || THREAT_COLORS.INFO;
      return '<div class="osint-item">' +
        '<span class="threat-dot" style="background:' + color + '"></span>' +
        '<span class="threat-level">' + (item.threatLevel || 'INFO') + '</span>' +
        '<span class="threat-title">' + (item.title || '').slice(0, 80) + '</span>' +
        '</div>';
    }).join('');
  };

  OsintViz.prototype._renderSocial = function() {
    var list = document.getElementById('osintSocialList');
    if (!list || !this._data.social || !this._data.social.bookmarks) {
      if (list) list.innerHTML = '<div class="osint-empty">No bookmarks cached</div>';
      return;
    }
    var items = this._data.social.bookmarks.slice(0, 10);
    list.innerHTML = items.map(function(bm) {
      return '<div class="osint-item">' +
        '<span class="social-cat">' + (bm.category || 'uncategorized') + '</span>' +
        '<span class="social-title">' + (bm.title || bm.text || '').slice(0, 60) + '</span>' +
        '</div>';
    }).join('');
  };

  OsintViz.prototype._renderAnalysis = function() {
    var el = document.getElementById('osintAnalysisContent');
    if (!el || !this._data.analysis) {
      if (el) el.innerHTML = '<div class="osint-empty">No analysis cached</div>';
      return;
    }
    var a = this._data.analysis;
    el.innerHTML =
      '<div class="analysis-method">' + (a.method || 'General') + '</div>' +
      '<div class="analysis-format">' + (a.format || '') + '</div>' +
      '<div class="analysis-time">' + (a.analyzedAt || '') + '</div>';
  };

  OsintViz.prototype._renderSummary = function() {
    var el = document.getElementById('osintSummary');
    if (!el) return;
    var parts = [];
    if (this._data.feeds && this._data.feeds.items) parts.push('Feeds: ' + this._data.feeds.items.length);
    if (this._data.social && this._data.social.bookmarks) parts.push('Social: ' + this._data.social.bookmarks.length);
    if (this._data.imagery && this._data.imagery.detections) parts.push('Detections: ' + this._data.imagery.detections.length);
    if (this._data.analysis) parts.push('Analysis: ' + (this._data.analysis.method || 'active'));
    el.innerHTML = '<span>OSINT: ' + (parts.length > 0 ? parts.join(' | ') : 'Awaiting data...') + '</span>';
  };

  window.OsintViz = OsintViz;
})();
