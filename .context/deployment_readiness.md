# Deployment Readiness Assessment

**As of:** 2026-05-07

---

## Overall Verdict: NOT READY

The app is functionally complete for core use cases, but three blockers must be resolved before any release.

---

## Blockers (Must Fix)

| # | Issue | File | Severity |
|---|-------|------|----------|
| 1 | 2 failing unit tests | `database.service.spec.ts` | High — CI gate |
| 2 | `environment.ts` hardcoded to production | `environment.ts` | High — dev risk |
| 3 | No 404 catch-all route | `app.routes.ts` | Medium — UX |

### Blocker 1: Failing tests
`DatabaseService` specs assert `DB_VERSION = 2`; actual code is `DB_VERSION = 3`. CI will fail. Fix the spec assertions before any merge.

### Blocker 2: Production environment in dev
`src/environments/environment.ts` is set to `production: true` with the live Railway URL. Any `npm start` run by a developer hits the real backend. This is a data-safety and developer-experience issue. The local dev block must be restored.

### Blocker 3: Unknown URL blank page
Missing `{ path: '**', redirectTo: 'recipes' }` in router. While not a crash, any deep-link failure leaves the user on a blank page with no recovery path.

---

## Web Deployment

| Check | Status |
|-------|--------|
| Production build compiles | ✅ (`dist/recetapps/` exists) |
| Auth flow (login/register) | ✅ |
| Recipe CRUD | ✅ |
| Image upload & cache | ✅ (Cache API) |
| Category management | ✅ |
| Favorites | ✅ |
| i18n (Spanish) | ✅ |
| Unit tests green | ❌ 2 failing |
| Search UI | ❌ Not implemented |
| 404 route | ❌ Missing |
| Unsaved-changes guard | ❌ Missing |

**Web readiness: ~85%**

---

## Android (Capacitor) Deployment

| Check | Status |
|-------|--------|
| SQLite CRUD (recipes, categories, favorites) | ✅ |
| Offline-first sync (push/pull) | ✅ |
| Image caching to device filesystem | ✅ |
| Network-aware sync on reconnect | ✅ |
| App foreground/background sync | ✅ |
| DB schema migrations (v1→v3) | ✅ |
| Login/register works offline-first | ✅ |
| `RecipeSqliteRepository.getFavorites()` | ❌ Broken SQL (not currently called) |
| Android icons current | ✅ (icons present in `public/`) |
| E2E / device tests | ❌ None |
| Unit tests green | ❌ 2 failing |

**Android readiness: ~82%**

---

## Readiness by Layer

| Layer | Readiness |
|-------|-----------|
| Domain (models + ports) | 100% |
| Application (stores + services) | 95% |
| Infrastructure — HTTP adapters | 95% |
| Infrastructure — SQLite adapters | 88% |
| Infrastructure — Shared services | 98% |
| UI components | 90% |
| Routing | 85% |
| Test suite | 99.4% (332/334) |
| CI / build pipeline | No pipeline defined (no `.github/workflows/`) |

---

## Release Checklist

- [ ] Fix `database.service.spec.ts` (update version assertions to v3)
- [ ] Fix or remove `RecipeSqliteRepository.getFavorites()`
- [ ] Restore local dev environment in `environment.ts`
- [ ] Add 404 catch-all route
- [ ] Implement recipe search UI
- [ ] Fix recipe list sort for temp negative IDs
- [ ] Verify `npx cap sync` + Android build passes
- [ ] Manual smoke test on device (login → create → sync → offline create → reconnect → verify push)
