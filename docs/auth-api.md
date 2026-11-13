# Authentication API

The API uses bcrypt password hashes and signed JWT Bearer access tokens.

Configure `JWT_SECRET` with a random secret of at least 32 characters before starting the API. `JWT_EXPIRATION` is optional and defaults to `7d`.

For local Docker Compose, copy `.env.example` to `.env`, set a unique alphanumeric `POSTGRES_PASSWORD`, update `DATABASE_URL` to use the same password, and set `JWT_SECRET` (for example, `openssl rand -hex 32`). Compose fails fast when either required secret is missing. Set `NODE_ENV=production` in production deployments. Do not reuse local values in staging or production. Demo accounts are seeded only when `NODE_ENV` is not `production` and both `DEMO_ACCOUNT_PASSWORD` and `E2E_ACCOUNT_PASSWORD` are configured; the seed command does not print passwords.

## Register

`POST /auth/register`

```json
{
  "fullName": "Nguyen Van An",
  "email": "an@example.com",
  "password": "at-least-8-characters",
  "phone": "0901234567"
}
```

`phone` is optional; spaces, parentheses, and hyphens are removed before storing an 8–15 digit value (optional leading `+`). Returns `201` with `{ "accessToken": "..." }`. Email is trimmed and lowercased. A duplicate email returns `409`; invalid input returns `400`.

## Login

`POST /auth/login`

```json
{
  "email": "an@example.com",
  "password": "at-least-8-characters"
}
```

Returns `200` with `{ "accessToken": "..." }`. Invalid credentials return `401`.

## Protected route and reusable guard

`GET /auth/me` requires `Authorization: Bearer <accessToken>`. Missing, invalid, or expired tokens return `401`. The authenticated user is made available through `@CurrentUser()`; feature modules can import `JwtAuthGuard` and `CurrentUser` from `apps/api/src/auth/public.ts`.

`GET /auth/staff/me` additionally requires the `BARISTA`, `MANAGER`, or `ADMIN` role. A valid customer token receives `403`; a missing, invalid, or expired token receives `401`. Feature controllers can apply role policies with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(Role.MANAGER, Role.ADMIN)`. The `Roles` decorator and `RolesGuard` are exported from `apps/api/src/auth/public.ts`.

Tokens use HS256 and include the user ID as `sub`, along with email and role. Password hashes are never included in API responses or token claims.

Registration does not accept a role. Unknown request fields are rejected by the global validation pipe, and new accounts receive the Prisma default `CUSTOMER` role.

## Security tests

Run from the repository root with `npm --workspace @brewlite/api test -- --runInBand auth.security.spec.ts jwt.config.spec.ts`. The API-level suite uses a mocked Prisma service, so it verifies the HTTP contract and guards but is not a PostgreSQL integration test. It covers bcrypt hashing, email/phone normalization, role-injection rejection, duplicate email, invalid credentials, bcrypt's 72-byte boundary, missing/malformed/expired JWTs, invalid signatures/claims, and customer-versus-staff access (`401`/`403`). `jwt.config.spec.ts` checks that a missing or short secret fails closed.

### Local demo accounts

These accounts can be seeded into a local database in development/test only. Set both password environment variables in the ignored local `.env` file; production seeding skips demo users. Never try these accounts against the live URLs.

| Role | Email | Local seeded password |
| --- | --- | --- |
| Customer | `customer@brewlite.vn` | `DEMO_ACCOUNT_PASSWORD` |
| Barista | `barista@brewlite.vn` | `DEMO_ACCOUNT_PASSWORD` |
| Admin | `admin@brewlite.vn` | `DEMO_ACCOUNT_PASSWORD` |
| E2E customer | `e2e.customer@brewlite.test` | `E2E_ACCOUNT_PASSWORD` |
