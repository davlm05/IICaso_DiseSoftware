# SmartCart AI Development Platform (`aidev`)

A self-contained, **spec-driven** development ecosystem (Caso #2). A standalone orchestrator drives a
fleet of specialized Claude agents to turn a high-level feature request into a production-ready Pull
Request, with minimal manual intervention.

```
/feature  →  /build-feature  →  /validate-feature  →  /release-feature
 SPECIFIED        BUILT            VALIDATED              RELEASED
```

## What it does

| Command | Result | Agents |
|---|---|---|
| `aidev feature "<desc>"` | Generates specs in all six domains (`frontend, backend, data, observability, testing, cicd`) | orchestrator + domain agents |
| `aidev build-feature <id>` | Implements the feature in `frontend/` and `backend/` | frontend, backend, data, infra |
| `aidev validate-feature <id>` | Validates (functional / architectural / spec / security / standards); on pass, authors unit + integration + contract tests | validation, qa |
| `aidev release-feature <id>` | Runs tests + quality gates + CI parity, writes release notes, creates branch, opens PR (feedback loop on failure) | orchestrator + qa |

Every feature is tracked by a manifest at `platform/specs/<id>/feature.json` — a complete, resumable
audit trail of status, specs, build, validation, tests, and release.

## Architecture

```
aidev (CLI / REPL)
   └── Engine (state machine, feedback loops)        src/engine.ts
        └── FeatureStrategy
             ├── AgentStrategy (online, real Claude) src/agent-strategy.ts
             │     └── AgentRunner (tool-use loop)    src/agent-runner.ts
             │           └── LlmClient → Anthropic    src/llm.ts
             └── ScaffoldStrategy (offline, no key)   src/strategy.ts
```

- **Agents** live in `agents/<name>/` as `prompt.md` + `agent.json` (model, max tokens, bound README
  section, structured-output schema).
- **Binding grounding:** the **frontend** agent is bound to **README.md §1 Frontend Design**; every other
  agent is bound to **README.md §2 Backend Design**. The relevant section is injected into the agent's
  system prompt at runtime (`src/readme.ts`) and enforced by the validation agent.
- **Templates** (`templates/`), shared **prompts** (`prompts/`), and a how-to **skills/** library encode
  SmartCart conventions so generated code matches the existing codebase.

## Quick start (with Docker — full ecosystem)

```bash
cp .env.example .env                 # set ANTHROPIC_API_KEY (and optional GH_TOKEN)
cp backend/.env.example backend/.env # backend stack env
docker compose up -d                 # postgres, redis, pgbouncer, api, worker, frontend, orchestrator

# Drive the workflow inside the orchestrator container:
docker compose exec orchestrator aidev feature "Implement customer self-service password reset"
docker compose exec orchestrator aidev build-feature <feature-id>
docker compose exec orchestrator aidev validate-feature <feature-id>
docker compose exec orchestrator aidev release-feature <feature-id>
```

On `up`, the stack also:
- runs a one-shot **`db-migrate`** service (`prisma db push`) so the API has its tables on first boot;
- has the **orchestrator** install the backend (pnpm) + frontend (npm) deps so `/release-feature`'s
  quality gates run inside the container (set `AIDEV_INSTALL_APP_DEPS=0` to skip for a faster boot).

Each container installs its own dependencies on startup — no manual `npm install` / `pnpm install`.

> **Note on test gates:** the backend currently ships source **without `*.spec.ts` files**, so the unit
> gate runs with `--passWithNoTests` (a frontend-only feature isn't blocked by absent backend specs). The
> QA agent writes real `*.spec.ts` / `*.test.tsx` files, which then run and must pass. Remove the flag in
> [src/engine.ts](src/engine.ts) once the backend has its own baseline tests.

## Quick start (host)

```bash
cd platform
npm install && npm run build
export ANTHROPIC_API_KEY=sk-ant-...
node dist/cli.js feature "Implement customer self-service password reset"
# ...build-feature / validate-feature / release-feature, or: node dist/cli.js repl
```

## Use this Claude account (no API key)

The agents authenticate through a small `LlmClient` ([src/llm.ts](src/llm.ts)) that supports three
modes, resolved by `resolveAuth()` in [src/config.ts](src/config.ts):

| `AIDEV_AUTH_MODE` | Credential |
|---|---|
| `api-key` | metered `ANTHROPIC_API_KEY` (console.anthropic.com) |
| `oauth` | your logged-in Claude session / subscription via `ANTHROPIC_AUTH_TOKEN` |
| `auto` (default) | API key if set, else the OAuth token, else an `ant auth login` profile |

To run the agents on **this Claude account's subscription** instead of a metered key:

```bash
# one-time: log in with the SAME account (opens a browser)
ant auth login

# reuse that session for the platform (exports the OAuth token + sets oauth mode)
source platform/scripts/use-claude-auth.sh

# now the agents authenticate with the subscription:
node platform/dist/cli.js feature "Implement customer self-service password reset"
```

Under the hood, OAuth tokens are sent as `Authorization: Bearer` with the required
`anthropic-beta: oauth-2025-04-20` header. In Docker, set `AIDEV_AUTH_MODE=oauth` and
`ANTHROPIC_AUTH_TOKEN` in `.env` (the compose file passes both to the orchestrator).

> Caveats: subscription rate limits apply, and Claude Code's own `/login` may conflict with an
> `ant` profile — keep one (`ant auth status` shows which credential is active). Fully headless/cron
> use may still require an API key per Anthropic's terms.

## Offline mode (no API key)

For a credential-free dry run or grading, add `--offline` (or `AIDEV_OFFLINE=1`). The deterministic
**scaffold strategy** runs the full pipeline using the spec templates and placeholder artifacts — the
same state machine, statuses, manifest, and feedback loop, without calling the LLM.

```bash
node dist/cli.js --offline feature "Implement customer self-service password reset"
node dist/cli.js --offline build-feature <id>
node dist/cli.js --offline validate-feature <id>
node dist/cli.js list
```

### Verified demo run (offline)

```
$ aidev --offline feature "Implement customer self-service password reset"
  spec[frontend]      -> platform/specs/frontend/<id>.md
  spec[backend]       -> platform/specs/backend/<id>.md
  spec[data]          -> platform/specs/data/<id>.md
  spec[observability] -> platform/specs/observability/<id>.md
  spec[testing]       -> platform/specs/testing/<id>.md
  spec[cicd]          -> platform/specs/cicd/<id>.md
  status: SPECIFIED

$ aidev --offline build-feature <id>     → status: BUILT
$ aidev --offline validate-feature <id>  → status: VALIDATED  (validated + 1 test(s))
```

The online run (with `ANTHROPIC_API_KEY`) is identical, but the agents author real specs, code, and
tests instead of scaffolds, and `release-feature` opens a PR.

## Development

```bash
npm run type-check   # tsc --noEmit
npm test             # jest (offline; no network/key)
npm run build        # compile to dist/
```

## Layout

```
platform/
├── specs/        generated specs + per-feature manifest
├── agents/       7 agents: orchestrator, frontend, backend, data, infra, validation, qa
├── skills/       project-specific how-to library (advisory)
├── prompts/      shared system preamble + validation rubric
├── templates/    six domain spec templates + PR + release-notes
├── workspace/    per-run transcripts/logs (gitignored)
├── scripts/      bootstrap + aidev launcher
├── docker/       Dockerfile.orchestrator, Dockerfile.frontend, entrypoints
├── tests/        platform unit tests
└── src/          orchestrator engine
```
