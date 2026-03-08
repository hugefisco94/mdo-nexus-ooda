/**
 * Gemini CLI Adapter - Google Gemini CLI
 * Clean Architecture: Adapter Layer
 *
 * Non-interactive: gemini -p "prompt"
 * Strengths: Large context analysis, multi-modal, documentation
 */
'use strict';

const { spawn } = require('child_process');
const { BaseAdapter } = require('./base-adapter');

class GeminiAdapter extends BaseAdapter {
  constructor(config) {
    super('gemini', config);
    this.bin = config.gemini?.bin || 'gemini';
    this.timeout = config.gemini?.timeout || 120000;
  }

  async probe() {
    return this._tracked(async () => {
      const out = await this._run(['--version'], 5000);
      this.available = /\d+\.\d+/.test(out);
      return this.available;
    });
  }

  async execute(prompt, options = {}) {
    if (!this.available) {
      const p = await this.probe();
      if (!p.ok || !p.data) return { ok: false, error: 'Gemini CLI not available', adapter: this.name };
    }
    return this._tracked(async () => {
      const args = ['-p', prompt];
      if (options.model) args.push('-m', options.model);
      if (options.yolo) args.push('-y');
      const output = await this._run(args, options.timeout || this.timeout);
      return output.trim();
    });
  }

  _run(args, timeout) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      // Build shell command with properly quoted arguments
      const quoted = args.map(a => a.includes(' ') || a.includes('[') ? `"${a.replace(/"/g, '\\"')}"` : a);
      const cmd = `${this.bin} ${quoted.join(' ')}`;
      const proc = spawn(cmd, [], {
        timeout,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env },
      });
      proc.stdout.on('data', d => chunks.push(d));
      proc.stderr.on('data', d => chunks.push(d));
      proc.on('close', code => {
        const output = Buffer.concat(chunks).toString('utf8');
        if (code === 0 || output.length > 0) resolve(output);
        else reject(new Error(`gemini exited with code ${code}`));
      });
      proc.on('error', reject);
    });
  }
}

module.exports = { GeminiAdapter };
