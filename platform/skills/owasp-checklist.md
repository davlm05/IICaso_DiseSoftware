# Skill: OWASP security checklist

The validation agent enforces this against the implementation (README §1.3 / §2.5).

- **Broken access control** — every endpoint/route enforces authN + RBAC; default deny.
- **Injection** — all inputs validated (class-validator / Zod); use Prisma parameterized queries only.
- **Cryptographic failures** — passwords hashed with bcrypt; tokens signed/short-lived; secrets from env.
- **Sensitive data exposure** — no PII/secrets in logs, errors, or the mobile bundle; minimize PII.
- **Security misconfiguration** — helmet on; CORS scoped; no debug endpoints in prod.
- **SSRF / unvalidated redirects** — validate any outbound URL/host.
- **Insufficient logging** — security-relevant events logged with `trace-id` (but never the secret value).
- **Rate limiting** — auth and write-heavy endpoints are rate-limited (Redis).

A finding in any item fails the `security` dimension and routes feedback to the responsible agent.
