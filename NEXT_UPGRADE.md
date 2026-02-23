# Next.js upgrade notes

## Does upgrading to the latest Next.js require migration?

Yes. This project is currently pinned to Next.js 13.5.6, so moving to the current latest major version should be treated as a migration, not only a package bump.

## Recommended approach

1. Upgrade one major version at a time (13 -> 14 -> 15/latest available in your registry).
2. Run official Next.js codemods for each major step.
3. Keep `next`, `eslint-config-next`, `react`, and `react-dom` versions aligned.
4. Validate critical flows after each step:
   - login and auth callback redirect
   - list create/read/delete API handlers
   - dashboard/my-lists pages
5. Run lint and build in CI before merging.

## Why this repository still needs careful validation

- It uses App Router route handlers and navigation hooks, which are commonly affected by major upgrades.
- There is custom auth and Prisma-backed API logic that should be regression tested after each step.
