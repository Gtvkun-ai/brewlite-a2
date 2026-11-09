# Authentication API

The API uses bcrypt password hashes and signed JWT Bearer access tokens.

Configure `JWT_SECRET` with a random secret of at least 32 characters before starting the API. `JWT_EXPIRATION` is optional and defaults to `7d`.

## Register

`POST /auth/register`

```json
{
  "fullName": "Nguyen Van An",
  "email": "an@example.com",
  "password": "at-least-8-characters"
}
```

Returns `201` with `{ "accessToken": "..." }`. Email is trimmed and lowercased. A duplicate email returns `409`; invalid input returns `400`.

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

Tokens use HS256 and include the user ID as `sub`, along with email and role. Password hashes are never included in API responses or token claims.
