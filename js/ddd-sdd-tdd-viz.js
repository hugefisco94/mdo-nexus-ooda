/**
 * DDD-SDD-TDD Cycle Tracker
 * Recursive cycle count + convergence %
 */

class CycleTrackerViz {
  constructor(containerId, cyberData, testData) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.cyberData = cyberData;
    this.testData = testData;
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    // Cycle cards
    const grid = document.createElement('div');
    grid.className = 'tracker-grid';

    const cycles = [
      { type: 'ddd', label: 'DDD Cycles', count: this.cyberData.dddCycles || 0, desc: 'Domain-Driven Design' },
      { type: 'sdd', label: 'SDD Cycles', count: this.cyberData.sddCycles || 0, desc: 'Security-Driven Design' },
      { type: 'tdd', label: 'TDD Cycles', count: this.cyberData.tddCycles || 0, desc: 'Test-Driven Development' },
    ];

    for (const cycle of cycles) {
      const card = document.createElement('div');
      card.className = 'tracker-card ' + cycle.type;

      const count = document.createElement('div');
      count.className = 'count';
      count.textContent = '0';
      card.appendChild(count);

      const type = document.createElement('div');
      type.className = 'type';
      type.textContent = cycle.label;
      card.appendChild(type);

      grid.appendChild(card);

      // Animate count
      this.animateNumber(count, cycle.count, 1500);
    }

    this.container.appendChild(grid);

    // Convergence bar
    const convWrap = document.createElement('div');
    convWrap.className = 'convergence-bar';

    const convLabel = document.createElement('div');
    convLabel.className = 'convergence-label';

    const labelText = document.createElement('span');
    labelText.textContent = 'System Convergence';
    labelText.style.color = 'var(--text-secondary)';

    const pct = document.createElement('span');
    pct.className = 'pct';
    const convergencePct = Math.round((this.cyberData.currentReliability || 0) * 100);
    pct.textContent = convergencePct + '%';

    convLabel.appendChild(labelText);
    convLabel.appendChild(pct);
    convWrap.appendChild(convLabel);

    const track = document.createElement('div');
    track.className = 'convergence-track';

    const fill = document.createElement('div');
    fill.className = 'convergence-fill';
    fill.style.width = '0%';
    track.appendChild(fill);
    convWrap.appendChild(track);

    this.container.appendChild(convWrap);

    // Animate fill
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.width = convergencePct + '%';
      });
    });

    // Test summary
    if (this.testData && this.testData.summary) {
      const summary = document.createElement('div');
      summary.className = 'test-summary';

      const info = document.createElement('div');
      info.innerHTML = '<strong>' + this.testData.summary.total + '</strong> tests passing in ' +
        this.testData.summary.duration + 's<br>' +
        '<span style="font-size:.65rem;color:var(--text-dim)">Coverage: ' +
        this.testData.coverage.lines + '% lines, ' +
        this.testData.coverage.functions + '% functions</span>';

      const count = document.createElement('div');
      count.className = 'test-count';
      count.textContent = this.testData.summary.passing + '/' + this.testData.summary.total;

      summary.appendChild(info);
      summary.appendChild(count);
      this.container.appendChild(summary);
    }
  }

  animateNumber(el, target, duration) {
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

window.CycleTrackerViz = CycleTrackerViz;
