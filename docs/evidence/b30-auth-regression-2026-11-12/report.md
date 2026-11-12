# B-30 Auth Regression — 2026-11-12

**Live target:** [https://brewlite-a2.onrender.com](https://brewlite-a2.onrender.com)

## Scope and method

Regression covers register/login/JWT/RBAC, weak or missing JWT secret configuration, secret/log exposure checks, and the auth docs/traceability update. The API-level auth suite runs Nest HTTP handlers with a mocked Prisma service; no PostgreSQL-backed auth test is claimed by this report.

## Expected versus actual

| Check | Expected | Actual |
| --- | --- | --- |
| Registration with G-repro phone payload | `201`, phone is normalized and stored, bcrypt hash, default `CUSTOMER`, no password hash in response/token | **PASS** — API-level regression returned `201`; stored normalized phone was `0901234567`; role/hash assertions passed. Prisma is mocked in this suite. |
| Invalid/optional phone | malformed phone returns `400`; omitted phone remains optional | **PASS** — malformed phone returned `400` before Prisma; no-phone registration passed. |
| Client role injection | `400`, no user created | **PASS** — `400`; Prisma create not called. |
| Duplicate registration | `409` | **PASS** — `409`. |
| Login | Correct password `200`; incorrect credentials `401` with generic response | **PASS** — `200` / `401`. |
| JWT and RBAC | Missing/malformed/expired/bad-signature/unknown-role `401`; customer on staff route `403`; barista allowed | **PASS** — all expected status checks passed in API suite. |
| bcrypt UTF-8 boundary | >72 bytes returns `400` before database access | **PASS** — 75-byte password returned `400`; no Prisma lookup/create. |
| JWT config | Missing/short secret fails closed; configured expiration is honored | **PASS** — `jwt.config.spec.ts` covers all three cases. |
| Secret/log review | No deployment JWT secret in current source tree; Compose requires external secret; seed/auth logs do not print credentials | **PASS for current source/config** — Compose config parsed with temporary local-only variables; source review found only synthetic test JWT constants; demo seed is opt-in outside production and no longer prints passwords. Historical Git commits still contain earlier static demo values; see security finding below. |
| Repository checks | Lint, unit tests, typecheck and build pass | **PASS** — lint; API 60/60 tests; web 58/58 tests; test helper TypeScript check; API + web production build. |

## Live API checks

| Check | Expected | Actual |
| --- | --- | --- |
| Health endpoint | `200`, status `ok` | **PASS** — `200`, `status=ok`. |
| Anonymous protected routes | `401` | **PASS** — `/auth/me` and `/auth/staff/me` returned `401`. |
| Invalid login | `401` | **PASS** — invalid password returned `401`. |
| Customer on staff route | `403` | **PASS** — customer received `403`. |
| Barista on staff route | `200` | **PASS** — barista received `200`. |
| Registration with injected role | `400`, no account created | **PASS** — intentionally invalid request returned `400` for `role`; no user was created. A valid phone field was not rejected by live validation. |
| Registration phone field | API accepts optional phone field | **PASS** — a rejected role-injection request including valid `phone` reported only the invalid `role`; request was rejected before account creation. |

## Security finding requiring environment-side action

The live API accepted the previously public demo customer/barista credentials during read-only regression. The current source removes those passwords from public docs, requires explicit local-only seed passwords, and skips demo-account seeding in production; a local repository change cannot rotate already seeded live accounts or invalidate issued JWTs. **Deployment action remains open:** rotate live demo-account passwords and the JWT secret in the deployment environment, then invalidate old sessions. Earlier Git history still contains the former static Compose JWT/demo credentials; if those values were used by any deployment, treat them as compromised and rotate them. No password or token is recorded here.

## Commands

```powershell
npm --workspace @brewlite/api test -- --runInBand auth.security.spec.ts jwt.config.spec.ts
npm run lint
npm test
npx tsc --project tests/tsconfig.json --noEmit
npm run build
```

## Handoff status

- Source branch: `B`.
- Base commit: `804c7b805b8eda97ceb046aac34f7417394f0a71`.
- Final source commit SHA: see the B-30 handoff manifest and delivery note.
- Reviewer: pending human review; no reviewer approval is claimed by local verification.
- Live staging: auth/health status checks above were read-only, except rejected validation requests; no valid registration or account mutation was performed.
