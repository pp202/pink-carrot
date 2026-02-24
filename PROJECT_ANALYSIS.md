# Pink Carrot — Technical Project Analysis

## Executive summary
Pink Carrot is a small Next.js 13 App Router application for authenticated, per-user shopping lists. The foundation is solid (modern stack, clear layering, schema validation on create), but there are correctness and maintainability gaps in API behavior, Prisma usage patterns, and operational documentation that should be addressed before scaling usage.

---

## 1) Current architecture

### Stack
- **Frontend/App:** Next.js 13.5 (App Router), React 18, TypeScript.
- **UI:** Radix UI + Tailwind.
- **Authentication:** NextAuth (Google + Facebook OAuth).
- **Data layer:** Prisma Client against PostgreSQL.

### Request/data flow
1. User signs in via `/login` (NextAuth providers).
2. `signIn` callback creates a local user record if needed.
3. Middleware enforces auth on `/my-lists`, `/dashboard`, and `/api` routes.
4. Client pages call `/api/lists` handlers.
5. Route handlers call backend helpers (`src/backend/*`) which resolve `loggedUser()` and scope DB actions by `userId`.

### Domain model
- **User** (`id`, `username` [email lowercase]).
- **List** (`id`, `name`, `status`, `createdAt`, `userId`).
- `Status` enum currently includes `NEW` and `ARCHIVED`.

---

## 2) What is working well
- Separation of concerns is clear: `config` (infra), `backend` (data logic), `app/api` (HTTP), and `app/*` (UI).
- List creation uses Zod schema validation before persistence.
- Multi-tenant ownership intent is present in list query helpers.
- Login onboarding path (`createUserIfNew`) helps avoid missing local profiles.

---

## 3) High-priority issues (fix first)

### P0 — DELETE route implementation is inconsistent
- `DELETE /api/lists/[id]` does not `await` the async delete helper.
- It returns a **"List not found"** message even in the success branch.
- The handler currently cannot reliably distinguish success vs missing records.

**Impact:** incorrect API semantics and confusing UI behavior.

### P0 — Risky Prisma delete pattern
- Current helper uses `prisma.list.delete({ where: { id, AND: { userId }}})`.
- `delete` expects a unique selector; ownership filtering needs either:
  - `deleteMany({ where: { id, userId } })`, or
  - `findFirst({ where: { id, userId } })` then `delete({ where: { id } })`.

**Impact:** runtime errors or incorrect assumptions about ownership-safe deletes.

### P1 — Overly broad middleware matcher
- Matching `/api` globally means all API endpoints require auth, including potential future public routes.

**Impact:** accidental auth coupling and harder API expansion.

---

## 4) Medium-priority issues

### P2 — UX/domain mismatch for archive action
- UI icon says "Archive", but current operation is hard delete.
- Schema already supports `status = ARCHIVED`; behavior should align with domain language.

### P2 — Default/placeholder operational docs
- `README.md` still contains create-next-app template content.
- Missing environment setup for:
  - OAuth keys (`GOOGLE_*`, `FACEBOOK_*`, `NEXTAUTH_SECRET`)
  - Database URLs (`DATABASE_URL`)
  - Prisma migration workflow

### P2 — Code hygiene
- Unused imports (`NextApiRequest`, some `log` imports).
- Minor typing/style consistency opportunities in server/client boundaries.

---

## 5) Recommended implementation roadmap

### Phase 1: Correctness hardening (immediate)
1. Fix `DELETE` route to `await` backend call and return accurate status/message.
2. Replace delete helper with ownership-safe strategy (`deleteMany` preferred for single-call check).
3. Add API error handling for malformed IDs and unauthorized access paths.

### Phase 2: Product behavior alignment
1. Introduce archive endpoint/operation (`PATCH /api/lists/[id]`) updating `status`.
2. Update UI action text and icon behavior to match archive semantics.
3. Optionally add "show archived" toggle/filter.

### Phase 3: Quality + maintainability
1. Add route-level tests for list create/get/delete/archive with ownership constraints.
2. Add backend unit tests around `loggedUser`, `getLists`, `delete/archive` helpers.
3. Replace README template with practical setup + local run + deployment notes.

---

## 6) Suggested test matrix
- **Auth:** unauthenticated access to protected routes should redirect/fail as intended.
- **Ownership:** User A cannot read/delete/archive User B list.
- **Validation:** create endpoint rejects invalid payloads.
- **Lifecycle:** create → list → archive/delete reflects correctly in UI and API.
- **Regression:** DELETE returns deterministic response body and status codes.

---

## 7) Maintainer command checklist
- `npm run lint` — lint/type-level quality checks from Next.js tooling.
- `npm run build` — production compile validation.
- `npx prisma migrate status` — migration state verification.
- `npx prisma studio` — quick local data inspection during debugging.

