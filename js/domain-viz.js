/**
 * Domain Status Cards Visualization
 * 6 domain cards with health indicators
 */

class DomainViz {
  constructor(containerId, data) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.domains = data.domains || [];
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    for (const domain of this.domains) {
      const card = document.createElement('div');
      card.className = 'domain-card';
      card.setAttribute('data-domain', domain.id);

      // Header
      const header = document.createElement('div');
      header.className = 'domain-header';

      const name = document.createElement('div');
      name.className = 'domain-name';
      name.innerHTML = '<span class="icon">' + domain.icon + '</span> ' + domain.name;

      const status = document.createElement('div');
      status.className = 'domain-status ' + (domain.status === 'active' ? 'online' : 'offline');

      header.appendChild(name);
      header.appendChild(status);
      card.appendChild(header);

      // Health bar
      const healthWrap = document.createElement('div');
      healthWrap.className = 'domain-health';

      const healthBar = document.createElement('div');
      healthBar.className = 'health-bar';

      const healthFill = document.createElement('div');
      healthFill.className = 'health-fill';
      healthFill.style.width = '0%';
      healthFill.style.background = this.getHealthColor(domain.health);

      healthBar.appendChild(healthFill);

      const pct = document.createElement('span');
      pct.className = 'health-pct';
      pct.textContent = domain.health + '%';

      healthWrap.appendChild(healthBar);
      healthWrap.appendChild(pct);
      card.appendChild(healthWrap);

      // Agents
      const agentsWrap = document.createElement('div');
      agentsWrap.className = 'domain-agents';
      for (const agent of domain.agents) {
        const badge = document.createElement('span');
        badge.className = 'agent-badge';
        badge.textContent = agent;
        agentsWrap.appendChild(badge);
      }
      card.appendChild(agentsWrap);

      this.container.appendChild(card);

      // Animate health bar
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          healthFill.style.width = domain.health + '%';
        });
      });
    }
  }

  getHealthColor(health) {
    if (health >= 95) return '#10b981';
    if (health >= 85) return '#06b6d4';
    if (health >= 70) return '#f59e0b';
    return '#ef4444';
  }

  update(domains) {
    this.domains = domains;
    this.render();
  }
}

window.DomainViz = DomainViz;
