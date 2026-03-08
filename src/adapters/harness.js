/**
 * Harness.io Adapter - CI/CD Pipeline & Deployment Automation
 * Clean Architecture: Adapter Layer
 *
 * Harness Engineering: Pipeline-as-Code, webhook triggers, execution monitoring
 * GitHub Actions Alternative: PR/Merge/Deploy via Harness CI Stage
 *
 * Capabilities:
 *   - Pipeline trigger & execution monitoring (v1 — original)
 *   - Pipeline YAML upload (PUT/POST) (v2 — added)
 *   - GitHub PR creation via GitHub API (v2 — added)
 *   - GitHub PR merge via GitHub API (v2 — added)
 *   - Full deploy cycle: upload → trigger → wait → verify (v2 — added)
 *   - Execution log retrieval (v2 — added)
 *
 * Academic References (AI Engineering CI/CD):
 *   [1] Behl (2025) "Advancing MLOps" JISEM 10(2):867-873
 *   [2] Alrahal (2025) "MLOps: Changes and Tools" IJERT V14IS100158
 *   [3] Davis & Reed (2025) "Operationalizing MLOps" FEAIML 2(10):17-31
 *
 * Refactored from mdo-api-server/server.js Harness proxy endpoint.
 */
'use strict';

const { BaseAdapter } = require('./base-adapter');

class HarnessAdapter extends BaseAdapter {
  constructor(config) {
    super('harness', config);
    this.baseUrl = config.harness?.baseUrl || 'https://app.harness.io';
    this.pat = config.harness?.pat || process.env.HARNESS_PAT || '';
    this.account = config.harness?.account || 'u78286qpSgu9QDJX0SgHUg';
    this.org = config.harness?.org || 'default';
    this.project = config.harness?.project || 'default_project';
    this.pipelineId = config.harness?.pipelineId || 'mdo_ooda_ci_deploy';
    this.connector = config.harness?.connector || 'hugefisco94_github';
    this.githubToken = config.harness?.githubToken || process.env.GITHUB_TOKEN || '';
    this.githubRepo = config.harness?.githubRepo || 'hugefisco94/mdo-command-center';
  }

  async probe() {
    return this._tracked(async () => {
      if (!this.pat) {
        this.available = false;
        return false;
      }
      const raw = await this._api('GET', '/gateway/ng/api/user/currentUser');
      const data = JSON.parse(raw);
      this.available = !!data?.data?.uuid;
      return this.available;
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  Pipeline Operations
  // ═══════════════════════════════════════════════════════════════

  /** Trigger a pipeline execution */
  async trigger(pipelineId, inputSet) {
    const id = pipelineId || this.pipelineId;
    if (!this.pat) {
      return { ok: false, error: 'HARNESS_PAT not configured', adapter: this.name };
    }
    return this._tracked(async () => {
      const path = `/gateway/pipeline/api/pipeline/execute/${id}/v2`
        + `?${this._qs()}`;
      const raw = await this._api('POST', path, inputSet || {});
      return JSON.parse(raw);
    });
  }

  /** Upload pipeline YAML to Harness (create or update) */
  async uploadPipeline(yamlContent, pipelineId) {
    const id = pipelineId || this.pipelineId;
    return this._tracked(async () => {
      // Try update first
      let raw = await this._api(
        'PUT',
        `/gateway/pipeline/api/pipelines/${id}?${this._qs()}&storeType=INLINE`,
        yamlContent,
        'application/yaml'
      );
      let res = JSON.parse(raw);
      if (res?.status === 'SUCCESS') return { ok: true, action: 'updated', data: res };

      // Pipeline doesn't exist — create
      raw = await this._api(
        'POST',
        `/gateway/pipeline/api/pipelines?${this._qs()}&storeType=INLINE`,
        yamlContent,
        'application/yaml'
      );
      res = JSON.parse(raw);
      return { ok: res?.status === 'SUCCESS', action: 'created', data: res };
    });
  }

  /** Get pipeline execution status */
  async executionStatus(executionId) {
    return this._tracked(async () => {
      const path = `/gateway/pipeline/api/pipelines/execution/v2/${executionId}`
        + `?${this._qs()}`;
      const raw = await this._api('GET', path);
      return JSON.parse(raw);
    });
  }

  /** Wait for execution to reach terminal state */
  async waitForExecution(executionId, maxWaitMs = 300000) {
    const startTime = Date.now();
    const pollInterval = 10000;
    const terminal = ['SUCCESS', 'FAILED', 'ABORTED', 'EXPIRED', 'ERRORED'];

    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.executionStatus(executionId);
      const status = result?.data?.status;
      if (terminal.includes(status)) return { status, data: result };
      await new Promise(r => setTimeout(r, pollInterval));
    }
    return { status: 'TIMEOUT', data: null };
  }

  // ═══════════════════════════════════════════════════════════════
  //  GitHub PR Operations (Direct — no pipeline required)
  // ═══════════════════════════════════════════════════════════════

  /** Create a GitHub Pull Request */
  async createPR(head, base, title, body) {
    if (!this.githubToken) {
      return { ok: false, error: 'GITHUB_TOKEN not configured' };
    }
    return this._tracked(async () => {
      const res = await this._githubApi('POST', `/repos/${this.githubRepo}/pulls`, {
        title: title || `[MDO-OODA] ${head} → ${base || 'master'}`,
        head,
        base: base || 'master',
        body: body || `Automated PR via HarnessAdapter\nBranch: ${head}`,
      });
      const data = JSON.parse(res);
      if (data.number) {
        return { ok: true, number: data.number, url: data.html_url, data };
      }
      // 422 = PR already exists
      if (data.message?.includes('pull request already exists')) {
        const existing = await this._githubApi('GET',
          `/repos/${this.githubRepo}/pulls?head=hugefisco94:${head}&base=${base || 'master'}&state=open`);
        const prs = JSON.parse(existing);
        if (prs.length > 0) {
          return { ok: true, number: prs[0].number, url: prs[0].html_url, existing: true };
        }
      }
      return { ok: false, error: data.message, data };
    });
  }

  /** Merge a GitHub Pull Request */
  async mergePR(prNumber, method = 'merge') {
    if (!this.githubToken) {
      return { ok: false, error: 'GITHUB_TOKEN not configured' };
    }
    return this._tracked(async () => {
      // Wait for mergeable state
      for (let i = 0; i < 10; i++) {
        const prRaw = await this._githubApi('GET', `/repos/${this.githubRepo}/pulls/${prNumber}`);
        const pr = JSON.parse(prRaw);
        if (pr.mergeable === true) break;
        await new Promise(r => setTimeout(r, 3000));
      }

      const res = await this._githubApi('PUT', `/repos/${this.githubRepo}/pulls/${prNumber}/merge`, {
        commit_title: `Merge PR #${prNumber} [HarnessAdapter]`,
        commit_message: `Merged via HarnessAdapter — MDO-OODA Engine`,
        merge_method: method,
      });
      const data = JSON.parse(res);
      return { ok: !!data.merged, sha: data.sha, data };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  Full Deploy Cycle
  // ═══════════════════════════════════════════════════════════════

  /**
   * Full deployment: upload pipeline → trigger → wait → return result
   * This is the primary method for GitHub Actions alternative deployment.
   */
  async deploy(opts = {}) {
    const {
      yamlContent,
      featureBranch = '',
      baseBranch = 'master',
      prTitle = '',
      mergeMethod = 'merge',
      maxWaitMs = 300000,
    } = opts;

    const result = { upload: null, trigger: null, execution: null };

    // Step 1: Upload pipeline (if YAML provided)
    if (yamlContent) {
      result.upload = await this.uploadPipeline(yamlContent);
      if (!result.upload?.ok) return { ok: false, step: 'upload', result };
    }

    // Step 2: Trigger
    result.trigger = await this.trigger(null, {
      pipeline: {
        identifier: this.pipelineId,
        properties: {
          ci: { codebase: { build: { type: 'branch', spec: { branch: baseBranch } } } },
        },
      },
    });
    const execId = result.trigger?.data?.planExecution?.uuid;
    if (!execId) return { ok: false, step: 'trigger', result };

    // Step 3: Wait
    result.execution = await this.waitForExecution(execId, maxWaitMs);
    return {
      ok: result.execution?.status === 'SUCCESS',
      executionId: execId,
      status: result.execution?.status,
      result,
    };
  }

  /** Not used for chat — execute returns pipeline info */
  async execute(prompt) {
    return this.trigger();
  }

  // ═══════════════════════════════════════════════════════════════
  //  Internal Helpers
  // ═══════════════════════════════════════════════════════════════

  _qs() {
    return `accountIdentifier=${this.account}&orgIdentifier=${this.org}&projectIdentifier=${this.project}`;
  }

  async _api(method, path, body, contentType = 'application/json') {
    const opts = {
      method,
      headers: {
        'x-api-key': this.pat,
        'Content-Type': contentType,
        'Harness-Account': this.account,
      },
    };
    if (body) {
      opts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    const res = await fetch(`${this.baseUrl}${path}`, opts);
    return await res.text();
  }

  async _githubApi(method, path, body) {
    const opts = {
      method,
      headers: {
        'Authorization': `Bearer ${this.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`https://api.github.com${path}`, opts);
    return await res.text();
  }
}

module.exports = { HarnessAdapter };
