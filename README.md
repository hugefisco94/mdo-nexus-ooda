# MDO-Nexus-OODA

Cybernetic command system for Multi-Domain Operations.

Six bounded contexts. One decision loop. Real-time GPU inference on bare metal.

## What It Does

MDO-Nexus-OODA runs the OODA cycle (Observe, Orient, Decide, Act) across six operational domains — INTEL, CYBER, CODE, INFRA, DATA, AGENT — and feeds the output of each phase back through Wiener cybernetic control loops.

Cross-domain interactions are tracked in a 6×6 synergy matrix. When one domain fires, adjacent domains amplify. The system converges or diverges; either way, you see it happen.

## Architecture

```
┌─────────────────────────────────────────────┐
│           OODA State Machine                │
│  OBSERVE → ORIENT → DECIDE → ACT → loop    │
├─────────────────────────────────────────────┤
│         Cybernetics Engine                  │
│  1st-order control + 2nd-order adaptation   │
├─────────────────────────────────────────────┤
│        Cross-Domain Synergy Matrix          │
│  6×6 weighted graph · fire/amplify tracking │
├──────────┬──────────┬──────────┬────────────┤
│  INTEL   │  CYBER   │   CODE   │   INFRA    │
│  DATA    │  AGENT   │          │            │
├──────────┴──────────┴──────────┴────────────┤
│         Wiener Feedback Controller          │
│  PID loop · setpoint tracking · dampening   │
├─────────────────────────────────────────────┤
│         DDD / SDD / TDD Cycle Tracker       │
│  recursive domain → service → test cycles   │
└─────────────────────────────────────────────┘
```

## GPU Inference

Three-model RAG stack on AMD MI300X (192GB HBM3), served via vLLM:

| Role | Model | Port | VRAM |
|------|-------|------|------|
| Generation | Qwen3-30B-A3B MoE (3B active, FP8) | 8000 | ~30GB |
| Embedding | Qwen3-Embedding-8B (dim=4096) | 8001 | ~15GB |
| Reranker | Qwen3-Reranker-0.6B | 8002 | ~1.2GB |

Full pipeline: embed query → rerank candidates → generate answer. Single GPU, 65% utilization, 32K context window.

## Dashboard

Static PWA at [hugefisco94.github.io/mdo-nexus-ooda](https://hugefisco94.github.io/mdo-nexus-ooda/).

Six panels: OODA ring, cybernetics convergence chart, synergy heatmap, domain status cards, Wiener feedback diagram, DDD-SDD-TDD cycle tracker. Real-time SSE updates when the server runs.

## Run

```bash
npm install
npm start        # Express server on :3000
npm test         # 184 assertions, no framework
```

## CI/CD

Harness.io pipeline maps directly to OODA phases:

1. OBSERVE — health checks, telemetry collection
2. ORIENT — code analysis, threat assessment
3. DECIDE — build strategy, test selection
4. ACT — deploy to GitHub Pages

Push to master triggers the full cycle.

## Lineage

This project consolidates and supersedes:

- [mdo-command-center](https://github.com/hugefisco94/mdo-command-center) — original OODA engine and CLI
- [ai-orchestration-hub](https://github.com/hugefisco94/ai-orchestration-hub) — agent orchestration dashboard
- [mdo-api-server](https://github.com/hugefisco94/mdo-api-server) — backend state machine and cloud proxy
- [ai-orchestration-pipeline](https://github.com/hugefisco94/ai-orchestration-pipeline) — pipeline definitions
- [nexus](https://github.com/hugefisco94/nexus) — agent mission control dashboard

All prior work folded into a single system. No dependencies between the old repos remain.

## License

MIT
