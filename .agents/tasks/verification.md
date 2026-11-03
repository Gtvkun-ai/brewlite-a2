# Verification log

## FEAT-001 — Scaffold npm-workspaces monorepo root (status: completed)

Branch: `sprint-1/mvp-menu`. Shell: PowerShell on Windows — use `npm.cmd` / `npx.cmd` (npm.ps1 blocked).

### Results
- `npm.cmd install` → exit 0; `package-lock.json` created at repo root (audited 1 package, 0 vulnerabilities).
- `.gitignore` extended additively (kept `node_modules`, `.next`, `dist`, `.env`).
- Root `package.json`: `private`, `workspaces: ["apps/*"]`, `engines.node >=20`, scripts `lint`/`test`/`build` fan out via `npm run <s> --workspaces --if-present`.
- `.nvmrc` = `20`.

All three FEAT-001 acceptance criteria pass.

### Known transient state (read before reviewing lint/test/build)
While `apps/*` is **empty**, running `npm.cmd run lint`, `npm.cmd run test`, or `npm.cmd run build`
from the repo root exits **1** with `No workspaces found!`.

This is expected and transient:
- npm's `--if-present` only suppresses *missing scripts*, not the *zero-matching-workspace* error.
- It self-resolves the moment FEAT-002 adds the first app package under `apps/*`.

Decision (option A, confirmed with workflow parent): keep the exact root scripts as specified.
We intentionally did **not**:
- mask exit codes (`|| exit 0` / `|| true`) — that would permanently hide real lint/test/build
  failures once apps exist and defeat the purpose of the CI scripts; or
- add a placeholder app package — FEAT-001 is scoped to "no app code yet".

Reviewers: a non-zero exit from the root `lint`/`test`/`build` scripts is only acceptable while
`apps/*` has zero workspaces. Once any app lands, these must exit 0 on success and non-zero on real
failures.
