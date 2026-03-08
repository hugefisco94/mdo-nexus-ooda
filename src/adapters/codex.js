/**
 * Codex CLI Adapter - OpenAI Codex (codex-cli)
 * Clean Architecture: Adapter Layer
 *
 * Non-interactive: codex exec -p "prompt"
 * Strengths: Code generation, code review, refactoring
 */
'use strict';

const { spawn } = require('child_process');
const { BaseAdapter } = require('./base-adapter');

class CodexAdapter extends BaseAdapter {
  constructor(config) {
    super('codex', config);
    this.bin = config.codex?.bin || 'codex';
    this.timeout = config.codex?.timeout || 120000;
  }

  async probe() {
    return this._tracked(async () => {
      const out = await this._run(['-v'], 5000);
      this.available = out.includes('codex');
      return this.available;
    });
  }

  async execute(prompt, options = {}) {
    if (!this.available) {
      const p = await this.probe();
      if (!p.ok || !p.data) return { ok: false, error: 'Codex CLI not available', adapter: this.name };
    }
    return this._tracked(async () => {
      const args = ['exec', prompt];
      if (options.quiet) args.push('-q');
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
        else reject(new Error(`codex exited with code ${code}`));
      });
      proc.on('error', reject);
    });
  }
}

module.exports = { CodexAdapter };
