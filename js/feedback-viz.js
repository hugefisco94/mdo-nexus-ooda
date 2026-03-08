/**
 * Wiener Feedback Loop Diagram
 * sensor -> comparator -> controller -> effector -> plant -> feedback
 */

class FeedbackViz {
  constructor(canvasId, data) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.data = data;
    this.animPhase = 0;
    this.particlePhase = 0;

    this.nodes = [
      { label: 'SENSOR', sub: 'Observe', x: 0, y: 0, color: '#4CAF50' },
      { label: 'COMPARATOR', sub: 'Orient', x: 0, y: 0, color: '#2196F3' },
      { label: 'CONTROLLER', sub: 'Decide', x: 0, y: 0, color: '#FF9800' },
      { label: 'EFFECTOR', sub: 'Act', x: 0, y: 0, color: '#F44336' },
      { label: 'PLANT', sub: 'System', x: 0, y: 0, color: '#00BCD4' },
    ];

    this.resize();
    this.animate();
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

    // Position nodes
    const padX = 60;
    const nodeW = (w - padX * 2) / 4;
    const topY = 50;
    const bottomY = 150;

    this.nodes[0].x = padX;
    this.nodes[0].y = topY;
    this.nodes[1].x = padX + nodeW;
    this.nodes[1].y = topY;
    this.nodes[2].x = padX + nodeW * 2;
    this.nodes[2].y = topY;
    this.nodes[3].x = padX + nodeW * 3;
    this.nodes[3].y = topY;
    this.nodes[4].x = w / 2;
    this.nodes[4].y = bottomY;
  }

  animate() {
    this.animPhase += 0.015;
    this.particlePhase += 0.03;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // Draw connections (forward path: 0->1->2->3->4)
    this.drawArrow(this.nodes[0], this.nodes[1], 'rgba(76,175,80,.3)');
    this.drawArrow(this.nodes[1], this.nodes[2], 'rgba(33,150,243,.3)');
    this.drawArrow(this.nodes[2], this.nodes[3], 'rgba(255,152,0,.3)');
    this.drawArrow(this.nodes[3], { x: this.nodes[4].x + 40, y: this.nodes[4].y - 10 }, 'rgba(244,67,54,.3)');

    // Feedback path (4 -> 0)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(this.nodes[4].x - 40, this.nodes[4].y);
    ctx.lineTo(this.nodes[0].x, this.nodes[4].y);
    ctx.lineTo(this.nodes[0].x, this.nodes[0].y + 20);
    ctx.strokeStyle = 'rgba(0,188,212,.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Feedback label
    ctx.fillStyle = 'rgba(0,188,212,.5)';
    ctx.font = '9px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('FEEDBACK LOOP', this.w / 4, this.nodes[4].y + 18);

    // Signal particles along forward path
    this.drawParticle(this.nodes[0], this.nodes[1], '#4CAF50', 0);
    this.drawParticle(this.nodes[1], this.nodes[2], '#2196F3', 0.25);
    this.drawParticle(this.nodes[2], this.nodes[3], '#FF9800', 0.5);

    // Error signal label
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.font = '8px Inter, system-ui';
    ctx.textAlign = 'center';
    const errX = (this.nodes[0].x + this.nodes[1].x) / 2;
    ctx.fillText('error signal', errX, this.nodes[0].y - 22);

    // Wiener gain label
    const gainX = (this.nodes[2].x + this.nodes[3].x) / 2;
    ctx.fillText('K=' + (this.data.wienerGain || 0.42).toFixed(2), gainX, this.nodes[2].y - 22);

    // Draw nodes
    for (const node of this.nodes) {
      this.drawNode(node);
    }

    // Reference input arrow
    ctx.beginPath();
    ctx.moveTo(this.nodes[0].x - 35, this.nodes[0].y);
    ctx.lineTo(this.nodes[0].x - 18, this.nodes[0].y);
    ctx.strokeStyle = 'rgba(76,175,80,.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    this.drawArrowHead(this.nodes[0].x - 18, this.nodes[0].y, 0, 'rgba(76,175,80,.5)');

    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.font = '8px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('REF', this.nodes[0].x - 42, this.nodes[0].y + 3);
  }

  drawNode(node) {
    const ctx = this.ctx;
    const w = 70;
    const h = 36;

    // Background
    ctx.fillStyle = 'rgba(10,10,15,.85)';
    this.roundRect(node.x - w / 2, node.y - h / 2, w, h, 6);
    ctx.fill();

    // Border
    ctx.strokeStyle = this.hexToRgba(node.color, 0.4);
    ctx.lineWidth = 1;
    this.roundRect(node.x - w / 2, node.y - h / 2, w, h, 6);
    ctx.stroke();

    // Label
    ctx.fillStyle = node.color;
    ctx.font = 'bold 9px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x, node.y - 5);

    // Sub-label
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = '8px Inter, system-ui';
    ctx.fillText(node.sub, node.x, node.y + 8);
  }

  drawArrow(from, to, color) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(from.x + 36, from.y);
    ctx.lineTo(to.x - 36, to.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this.drawArrowHead(to.x - 36, to.y, 0, color);
  }

  drawArrowHead(x, y, angle, color) {
    const ctx = this.ctx;
    const size = 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2);
    ctx.lineTo(-size, size / 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  drawParticle(from, to, color, offset) {
    const ctx = this.ctx;
    const t = ((this.particlePhase + offset) % 1);
    const x = from.x + 36 + (to.x - 36 - from.x - 36) * t;
    const y = from.y + (to.y - from.y) * t;

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Trail
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = this.hexToRgba(color, 0.15);
    ctx.fill();
  }

  roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
}

window.FeedbackViz = FeedbackViz;
