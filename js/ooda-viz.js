/**
 * OODA Cycle Ring Visualization
 * Animated 4-phase ring: OBSERVE -> ORIENT -> DECIDE -> ACT
 */

class OODAViz {
  constructor(canvasId, data) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.data = data;
    this.phases = data.phases || [];
    this.currentPhase = data.phaseIndex || 0;
    this.cycleCount = data.cycleCount || 1;
    this.rotation = 0;
    this.pulsePhase = 0;
    this.hoveredPhase = -1;

    this.colors = ['#4CAF50', '#2196F3', '#FF9800', '#F44336'];
    this.labels = ['OBSERVE', 'ORIENT', 'DECIDE', 'ACT'];
    this.icons = ['\u{1F441}', '\u{1F9ED}', '\u2696', '\u26A1'];

    this.resize();
    this.bindEvents();
    this.animate();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width - 20, 320);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this.ctx.scale(dpr, dpr);
    this.size = size;
    this.cx = size / 2;
    this.cy = size / 2;
    this.radius = size / 2 - 30;
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      this.advancePhase();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - this.cx;
      const y = e.clientY - rect.top - this.cy;
      const angle = Math.atan2(y, x);
      const normalizedAngle = ((angle + Math.PI * 2.5) % (Math.PI * 2));
      this.hoveredPhase = Math.floor(normalizedAngle / (Math.PI / 2)) % 4;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredPhase = -1;
    });
  }

  advancePhase() {
    this.currentPhase = (this.currentPhase + 1) % 4;
    if (this.currentPhase === 0) this.cycleCount++;
    this.updateInfo();
  }

  updateInfo() {
    const infoEl = document.querySelector('.ooda-info');
    if (!infoEl) return;
    const phase = this.labels[this.currentPhase];
    const color = this.colors[this.currentPhase];
    infoEl.querySelector('.phase-name').textContent = phase;
    infoEl.querySelector('.phase-name').style.color = color;
    infoEl.querySelector('.cycle-count').textContent =
      'Cycle #' + this.cycleCount + ' | Tempo: Operational';
  }

  animate() {
    this.rotation += 0.003;
    this.pulsePhase += 0.04;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    const cx = this.cx;
    const cy = this.cy;
    const r = this.radius;

    ctx.clearRect(0, 0, this.size, this.size);

    // Outer ring glow
    const glowGrad = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 20);
    glowGrad.addColorStop(0, 'rgba(6,182,212,0.03)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, this.size, this.size);

    // Draw 4 arc segments
    for (let i = 0; i < 4; i++) {
      const startAngle = (i * Math.PI / 2) - Math.PI / 2 + this.rotation;
      const endAngle = startAngle + Math.PI / 2 - 0.04;
      const isActive = i === this.currentPhase;
      const isHovered = i === this.hoveredPhase;
      const pulse = isActive ? Math.sin(this.pulsePhase) * 0.15 + 0.85 : 1;

      // Arc
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.lineWidth = isActive ? 14 : (isHovered ? 11 : 8);

      const color = this.colors[i];
      const alpha = isActive ? pulse : (isHovered ? 0.7 : 0.35);
      ctx.strokeStyle = this.hexToRgba(color, alpha);
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow for active
      if (isActive) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.lineWidth = 22;
        ctx.strokeStyle = this.hexToRgba(color, 0.1);
        ctx.stroke();
      }

      // Label
      const midAngle = startAngle + Math.PI / 4;
      const labelR = r - 35;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.fillStyle = isActive ? color : (isHovered ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.4)');
      ctx.font = (isActive ? 'bold ' : '') + '11px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.labels[i], 0, 0);
      ctx.restore();

      // Arrow indicator on active segment tip
      if (isActive) {
        const tipX = cx + Math.cos(endAngle) * r;
        const tipY = cy + Math.sin(endAngle) * r;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10,10,15,.9)';
    ctx.fill();
    ctx.strokeStyle = this.hexToRgba(this.colors[this.currentPhase], 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center text
    ctx.fillStyle = this.colors[this.currentPhase];
    ctx.font = 'bold 16px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('#' + this.cycleCount, cx, cy);

    // Directional arrows between segments
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI / 2) - Math.PI / 2 + this.rotation - 0.02;
      const ax = cx + Math.cos(angle) * (r + 2);
      const ay = cy + Math.sin(angle) * (r + 2);
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillStyle = 'rgba(255,255,255,.15)';
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(3, 2);
      ctx.lineTo(-3, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  getState() {
    return {
      currentPhase: this.currentPhase,
      cycleCount: this.cycleCount,
      phaseName: this.labels[this.currentPhase]
    };
  }
}

window.OODAViz = OODAViz;
