/**
 * Synergy Matrix Visualization
 * 6x6 heatmap with hover tooltips
 */

class SynergyViz {
  constructor(containerId, data) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.labels = data.labels || [];
    this.matrix = data.matrix || [];

    this.domainColors = {
      'INTEL': '#9C27B0',
      'CYBER': '#F44336',
      'CODE': '#4CAF50',
      'INFRA': '#2196F3',
      'DATA': '#FF9800',
      'AGENT': '#00BCD4'
    };

    this.render();
  }

  render() {
    const table = document.createElement('table');
    table.className = 'synergy-table';

    // Header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.appendChild(document.createElement('th')); // empty corner
    for (const label of this.labels) {
      const th = document.createElement('th');
      th.textContent = label;
      th.style.color = this.domainColors[label] || '#94a3b8';
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    const tbody = document.createElement('tbody');
    for (let i = 0; i < this.matrix.length; i++) {
      const tr = document.createElement('tr');

      // Row header
      const th = document.createElement('th');
      th.textContent = this.labels[i];
      th.style.color = this.domainColors[this.labels[i]] || '#94a3b8';
      th.style.textAlign = 'right';
      th.style.paddingRight = '8px';
      tr.appendChild(th);

      for (let j = 0; j < this.matrix[i].length; j++) {
        const td = document.createElement('td');
        td.className = 'synergy-cell';

        const val = this.matrix[i][j];
        td.textContent = val.toFixed(2);

        // Color based on value
        const bg = this.getHeatColor(val);
        td.style.background = bg;

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'synergy-tooltip';
        tooltip.textContent = this.labels[i] + ' \u2194 ' + this.labels[j] + ': ' + (val * 100).toFixed(0) + '% synergy';
        td.appendChild(tooltip);

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    this.container.innerHTML = '';
    this.container.appendChild(table);
  }

  getHeatColor(val) {
    // 0.0 = dark/cool, 1.0 = bright/hot
    if (val >= 0.9) return 'rgba(6,182,212,.65)';
    if (val >= 0.8) return 'rgba(6,182,212,.45)';
    if (val >= 0.7) return 'rgba(16,185,129,.4)';
    if (val >= 0.6) return 'rgba(245,158,11,.35)';
    if (val >= 0.5) return 'rgba(255,152,0,.25)';
    if (val >= 0.4) return 'rgba(244,67,54,.2)';
    return 'rgba(255,255,255,.05)';
  }
}

window.SynergyViz = SynergyViz;
