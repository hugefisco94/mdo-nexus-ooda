/**
 * Cybernetics Convergence Chart
 * Line chart showing reliability % over OODA cycles
 */

class CyberneticsViz {
  constructor(canvasId, data) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.data = data;
    this.history = data.convergenceHistory || [];
    this.target = data.targetReliability || 0.95;
    this.animProgress = 0;
    this.hoverIndex = -1;

    this.resize();
    this.bindEvents();
    this.animateIn();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const w = rect.width - 10;
    const h = 200;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);
    this.w = w;
    this.h = h;
    this.padding = { top: 20, right: 20, bottom: 30, left: 45 };
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const chartW = this.w - this.padding.left - this.padding.right;
      const relX = x - this.padding.left;
      const idx = Math.round(relX / (chartW / Math.max(this.history.length - 1, 1)));
      this.hoverIndex = Math.max(0, Math.min(idx, this.history.length - 1));
      this.draw();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = -1;
      this.draw();
    });
  }

  animateIn() {
    const step = () => {
      this.animProgress = Math.min(this.animProgress + 0.02, 1);
      this.draw();
      if (this.animProgress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const p = this.padding;

    ctx.clearRect(0, 0, w, h);

    const chartW = w - p.left - p.right;
    const chartH = h - p.top - p.bottom;
    const maxVal = 1.0;
    const minVal = 0;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = p.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(p.left, y);
      ctx.lineTo(w - p.right, y);
      ctx.stroke();

      // Y-axis labels
      const val = Math.round((1 - i / 4) * 100);
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(val + '%', p.left - 8, y);
    }

    if (this.history.length < 2) return;

    // Target line
    const targetY = p.top + chartH * (1 - this.target / maxVal);
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(16,185,129,.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.left, targetY);
    ctx.lineTo(w - p.right, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(16,185,129,.5)';
    ctx.font = '9px Inter, system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('TARGET ' + Math.round(this.target * 100) + '%', w - p.right, targetY - 6);

    // Data points
    const points = [];
    const visibleCount = Math.ceil(this.history.length * this.animProgress);

    for (let i = 0; i < visibleCount; i++) {
      const x = p.left + (i / (this.history.length - 1)) * chartW;
      const y = p.top + chartH * (1 - this.history[i].reliability / maxVal);
      points.push({ x, y, data: this.history[i] });
    }

    // Gradient fill
    if (points.length > 1) {
      const gradient = ctx.createLinearGradient(0, p.top, 0, h - p.bottom);
      gradient.addColorStop(0, 'rgba(6,182,212,.15)');
      gradient.addColorStop(1, 'rgba(6,182,212,.0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, h - p.bottom);
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.lineTo(points[i].x, points[i].y);
        else {
          const prevX = points[i - 1].x;
          const prevY = points[i - 1].y;
          const cpx = (prevX + points[i].x) / 2;
          ctx.bezierCurveTo(cpx, prevY, cpx, points[i].y, points[i].x, points[i].y);
        }
      }
      ctx.lineTo(points[points.length - 1].x, h - p.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(points[i].x, points[i].y);
        else {
          const prevX = points[i - 1].x;
          const prevY = points[i - 1].y;
          const cpx = (prevX + points[i].x) / 2;
          ctx.bezierCurveTo(cpx, prevY, cpx, points[i].y, points[i].x, points[i].y);
        }
      }
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Data points
    for (let i = 0; i < points.length; i++) {
      const isHovered = i === this.hoverIndex;
      ctx.beginPath();
      ctx.arc(points[i].x, points[i].y, isHovered ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? '#06b6d4' : '#0a0a0f';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = isHovered ? 2 : 1.5;
      ctx.stroke();

      // X-axis labels
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('C' + this.history[i].cycle, points[i].x, h - p.bottom + 15);
    }

    // Hover tooltip
    if (this.hoverIndex >= 0 && this.hoverIndex < points.length) {
      const pt = points[this.hoverIndex];
      const val = Math.round(pt.data.reliability * 100);
      const txt = 'Cycle ' + pt.data.cycle + ': ' + val + '%';

      ctx.fillStyle = 'rgba(10,10,15,.9)';
      const tw = ctx.measureText(txt).width + 16;
      const tx = Math.min(Math.max(pt.x - tw / 2, 0), w - tw);
      ctx.fillRect(tx, pt.y - 28, tw, 20);
      ctx.strokeStyle = 'rgba(6,182,212,.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, pt.y - 28, tw, 20);

      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(txt, pt.x, pt.y - 15);
    }
  }

  updateStats() {
    const current = this.data.currentReliability || 0;
    const gain = this.data.wienerGain || 0;
    const rate = this.data.convergenceRate || 0;

    const els = document.querySelectorAll('.chart-stat .value');
    if (els[0]) { els[0].textContent = Math.round(current * 100) + '%'; els[0].style.color = '#06b6d4'; }
    if (els[1]) { els[1].textContent = gain.toFixed(2); els[1].style.color = '#10b981'; }
    if (els[2]) { els[2].textContent = rate.toFixed(3); els[2].style.color = '#f59e0b'; }
  }
}

window.CyberneticsViz = CyberneticsViz;
