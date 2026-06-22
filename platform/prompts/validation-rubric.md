# Validation rubric

The validation agent scores every implementation across five dimensions. Each check must cite concrete
evidence; a check with no evidence of passing fails.

| Dimension | Question | Bound to |
|---|---|---|
| **functional** | Does it do what the request + specs describe? | feature description, all specs |
| **architectural** | Layering, module conventions, atomic design, statelessness respected? | README §1.4 / §2.2 |
| **specification** | Is every spec commitment implemented, with no scope creep? | the six specs |
| **security** | OWASP Top 10: input validation, RBAC, secrets/PII, injection, safe errors? | README §1.3 / §2.5 |
| **standards** | Typing, naming, reuse, lint/format conventions? | repo conventions |

**Feedback routing.** When `pass` is false, each failing area is attributed to the responsible agent
(`frontend` / `backend` / `data` / `infra`) with a concrete, actionable issue list. The orchestrator
re-runs exactly those agents (Caso #2 §7 feedback loop) before re-validating.
