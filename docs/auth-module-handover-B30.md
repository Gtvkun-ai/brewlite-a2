# B-30 — Auth module handover

- **Owner:** B — Backend Auth & JWT
- **Scope:** FR-04, NFR-02
- **Source branch:** `B`
- **Base at start:** `804c7b805b8eda97ceb046aac34f7417394f0a71` (GitHub `main`, fast-forwarded into `B` before work)

## Module map

- `apps/api/src/auth/auth.controller.ts` — register, login, current-user and staff-only routes.
- `apps/api/src/auth/auth.service.ts` — email/phone normalization, bcrypt hash/compare, duplicate handling, password byte limit and token issuance.
- `apps/api/src/auth/jwt.config.ts` — fail-fast secret validation and token lifetime default.
- `apps/api/src/auth/jwt.strategy.ts` — HS256 Bearer validation and claims validation.
- `apps/api/src/auth/jwt-auth.guard.ts`, `roles.guard.ts`, `roles.decorator.ts` — authentication and role checks.
- `apps/api/src/auth/auth.security.spec.ts`, `jwt.config.spec.ts` — API-level security regression and config checks.
- `tests/e2e/auth-helper.ts` — fresh registration with phone, login, then `/auth/me` token check for authenticated profile data.
- `docs/diagrams/sequence-auth.puml` — register/login/JWT/RBAC sequence diagram.

## Contract and security behavior

- `POST /auth/register`: normalizes email, hashes the password, creates a default `CUSTOMER`; caller-supplied role is rejected by the global validation pipe. Duplicate email returns `409`.
- The optional registration phone field accepts the frontend's phone payload, strips spaces/parentheses/hyphens, validates 8–15 digits, and stores it in `User.phone`. This fixes G's repro in `docs/evidence/register-phone-bug-2026-11-11/repro-result.txt` (previously `400 property phone should not exist`).
- `POST /auth/login`: normalizes email; invalid email/password returns the same `401` response.
- JWT: HS256, required secret of at least 32 characters, default expiry `7d`; malformed, expired, invalid-signature or unsupported-role tokens return `401`.
- `GET /auth/staff/me`: `BARISTA`, `MANAGER`, `ADMIN` are allowed; a customer token receives `403`.
- Passwords over bcrypt's 72-byte UTF-8 input limit return `400` before Prisma access.
- Docker Compose requires externally supplied `JWT_SECRET` and `POSTGRES_PASSWORD`; PostgreSQL is published on loopback only. The seed skips demo accounts in production and no longer prints passwords.
- Auth routes do not log request bodies, passwords, bearer tokens or secret values.

## Local demo accounts

The Prisma seed creates these accounts only outside `NODE_ENV=production`, when both local password environment variables are set. They are disposable local fixtures; do not use them against live services.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@brewlite.vn` | `DEMO_ACCOUNT_PASSWORD` |
| Barista | `barista@brewlite.vn` | `DEMO_ACCOUNT_PASSWORD` |
| Admin | `admin@brewlite.vn` | `DEMO_ACCOUNT_PASSWORD` |
| E2E customer | `e2e.customer@brewlite.test` | `E2E_ACCOUNT_PASSWORD` |

## Regression evidence

Expected and actual outcomes, commands, secret/log review, and the final local commit are recorded in [`docs/evidence/b30-auth-regression-2026-11-12/report.md`](evidence/b30-auth-regression-2026-11-12/report.md). The API suite mocks Prisma, so it does not claim PostgreSQL-backed auth integration. Reviewer confirmation and any staging-only evidence are recorded separately; they are not inferred from local tests.
