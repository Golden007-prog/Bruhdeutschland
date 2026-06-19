# Data-isolation diagnosis (P0) — different accounts saw identical data

Date: 2026-06-20 · Status: root cause confirmed, fix in `0008` + client commits

## Reported bug
On the hosted build, signing in with two different accounts (`oikantik39@gmail.com`,
`basuoikantik@gmail.com`) back-to-back **in the same browser** showed the **same** profile
("OIKANTIK BASU", German GPA 1,9), extracted facts, and readiness. Account B saw Account A's data.

## Investigation (in the order of §1)

1. **Where does the data come from?** `grep localStorage|deutschprep:` across the frontend. Personal
   data is persisted through three **global, un-namespaced** localStorage keys:
   - `deutschprep:state` — `lib/persist/syncedStore.ts`. Holds the **profile**, onboarding flag,
     intake, shortlists, saved searches, tracker apps, target band (everything written via
     `useSyncedState`, incl. `useProfile`'s `PROFILE_KEY`).
   - `deutschprep:exam:attempts` — `lib/exam/attempts.ts` (mock-exam history).
   - `deutschprep:exam:progress:*` — `lib/exam/examProgress.ts` (in-progress exam).
   None of these include the user id in the key, so **every account on a browser shares them**.

2. **No hardcoded demo profile.** `DEFAULT_PROFILE` is empty; `lib/seed/profile.ts` is illustrative
   *program* matches, not a user profile. The "OIKANTIK BASU" data is the user's **real** data cached
   globally — not a seeded demo. (§1.b ruled out.)

3. **Is it persisted per-user in Supabase?** Yes — `settings` (per-user JSONB blob, RLS `auth.uid() =
   user_id`) plus dedicated tables. So the cloud side is per-user; the **on-device cache is not**.

4. **Is RLS the cause? No.** Scripted check:
   - `tables_without_rls` → **NONE** (every `public` table has RLS).
   - The only broad/public-read policy is `programs` (intentional, non-personal catalog). Every
     personal table's policy is gated by `auth.uid() = user_id` (owner-only). The Supabase security
     advisor reports zero RLS/policy lints. **RLS is correct.**

5. **Does anything reset on auth change? No.** `syncedStore.start()` subscribes to auth but:
   - on **sign-in** it calls `pullFromCloud()` which **merges** the cloud blob over the existing
     in-memory blob (`{ ...this.blob, ...cloud }`) — so keys the new user lacks in the cloud keep the
     **previous** user's local values;
   - on **sign-out** it sets `hydrated = true` and emits but **never clears** `this.blob` or
     localStorage;
   - the localStorage key is never namespaced by user.
   `attempts.ts` / `examProgress.ts` have no auth handling at all.

6. **Accounts are real.** Supabase Auth (magic-link + Google) is live on the hosted build; the bug is
   not a shared/demo identity.

## Confirmed root cause
A **client-side data-isolation failure**, not an RLS leak:

> Personal data is cached in **global, un-namespaced `localStorage`** and is **never reset on an auth
> transition**, and the cloud pull **merges** rather than replaces. So on the same browser, a second
> account reads the first account's cached blob; and once the second account writes anything, the
> merged blob (containing the first account's data) is flushed to the **second** account's `settings`
> row — propagating the contamination to the cloud.

## Fix (this change)
- **Namespace every personal localStorage store by user id** (`…:<uid|anon>`): `syncedStore`,
  `attempts`, `examProgress`. A shared `lib/persist/userScope.ts` tracks the active user (from
  `onAuthChange`).
- **Full reset on every auth transition** (sign-in / user-switch / sign-out): rebuild in-memory state
  from the **new** identity's namespace only — no carryover — then load that user's cloud data
  (replace within the user's own scope). Sign-out → empty `anon` scope.
- **Delete the legacy global keys** (`deutschprep:state`, `deutschprep:exam:attempts`,
  `deutschprep:exam:progress:*`) on first run so trapped mixed data is never read again. Real data
  survives in each user's own cloud `settings`/`exam_attempts` rows.
- **A new account starts EMPTY** → onboarding + honest empty states (0% completeness, no facts).
- **"Reset my saved data"** control (Account): clears the current user's `settings` row + all local
  namespaces — the user-initiated remedy for any `settings` row already polluted by the pre-fix bug
  (we cannot safely auto-distinguish polluted vs legitimate cloud data).
- Non-personal device prefs (theme, BYOK API keys, TTS tier/rate) stay device-global by design (§2A).

## Proof
Unit tests assert: set data as user A → switch to B → B sees fallback/empty → switch back to A → A's
data intact; exam attempts the same; a fresh identity reads nothing. RLS coverage is scripted above.
