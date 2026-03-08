/**
 * Synergy Matrix - 6x6 Cross-Domain Synergy State Machine
 * Clean Architecture: Core Domain (innermost, zero I/O)
 *
 * Tracks synergy strength between 6 MDO domains:
 *   INTEL, CYBER, CODE, INFRA, DATA, AGENT
 *
 * Each fire() call increases coupling between two domains.
 * Amplification is detected when fire count exceeds threshold.
 */
'use strict';

const DOMAINS = ['INTEL', 'CYBER', 'CODE', 'INFRA', 'DATA', 'AGENT'];
const DEFAULT_SELF = 1.0;
const DEFAULT_CROSS = 0.5;
const FIRE_INCREMENT = 0.05;
const AMPLIFICATION_THRESHOLD = 3;

class SynergyMatrix {
  constructor(initial = null) {
    this.domains = DOMAINS;
    this.size = DOMAINS.length;
    this.grid = {};
    this.events = [];
    this.fireCounts = {};

    if (initial && initial.matrix && initial.labels) {
      this._loadFromJson(initial);
    } else {
      this._initDefault();
    }
  }

  _initDefault() {
    for (const d of DOMAINS) {
      this.grid[d] = {};
      for (const t of DOMAINS) {
        this.grid[d][t] = d === t ? DEFAULT_SELF : DEFAULT_CROSS;
      }
    }
  }

  _loadFromJson(json) {
    const labels = json.labels;
    const matrix = json.matrix;
    for (let i = 0; i < labels.length; i++) {
      this.grid[labels[i]] = {};
      for (let j = 0; j < labels.length; j++) {
        this.grid[labels[i]][labels[j]] = matrix[i][j];
      }
    }
  }

  /** Get full matrix as object */
  get() {
    return JSON.parse(JSON.stringify(this.grid));
  }

  /** Get strength between two domains */
  strength(from, to) {
    if (!this.grid[from] || this.grid[from][to] === undefined) {
      throw new Error(`Invalid domain pair: ${from} -> ${to}`);
    }
    return this.grid[from][to];
  }

  /** Fire a synergy event between two domains */
  fire(from, to, event = 'synergy') {
    if (!this.grid[from] || this.grid[from][to] === undefined) {
      return { error: `Invalid domain pair: ${from} -> ${to}` };
    }

    const prev = this.grid[from][to];
    this.grid[from][to] = Math.min(1.0, prev + FIRE_INCREMENT);

    const key = `${from}->${to}`;
    this.fireCounts[key] = (this.fireCounts[key] || 0) + 1;

    const record = {
      from,
      to,
      event,
      prevStrength: prev,
      strength: this.grid[from][to],
      fireCount: this.fireCounts[key],
      amplified: this.fireCounts[key] > AMPLIFICATION_THRESHOLD,
      ts: Date.now(),
    };

    this.events.push(record);
    return record;
  }

  /** Get amplification data */
  amplification() {
    const pairs = Object.entries(this.fireCounts).map(([key, count]) => {
      const [from, to] = key.split('->');
      return {
        pair: key,
        from,
        to,
        fireCount: count,
        currentStrength: this.grid[from] ? this.grid[from][to] : 0,
        amplified: count > AMPLIFICATION_THRESHOLD,
      };
    });

    return {
      totalEvents: this.events.length,
      pairs,
      hotPairs: pairs.filter(p => p.amplified),
    };
  }

  /** Validate that all domains are connected (all cross-domain > 0) */
  validate() {
    const issues = [];
    for (const from of DOMAINS) {
      for (const to of DOMAINS) {
        if (from === to) continue;
        if (!this.grid[from] || this.grid[from][to] <= 0) {
          issues.push({ from, to, issue: 'disconnected' });
        }
      }
    }
    return {
      valid: issues.length === 0,
      domainCount: DOMAINS.length,
      connectionCount: DOMAINS.length * (DOMAINS.length - 1),
      issues,
    };
  }

  /** Full event history */
  history() {
    return this.events.slice();
  }

  /** Static factory */
  static create(json) {
    return new SynergyMatrix(json);
  }
}

module.exports = { SynergyMatrix, DOMAINS, FIRE_INCREMENT, AMPLIFICATION_THRESHOLD };
