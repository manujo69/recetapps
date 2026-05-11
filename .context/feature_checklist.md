# Feature Checklist and Completion Percentages

**As of:** 2026-05-07

## Authentication — 100%
- [x] Login form (PrimeNG InputText, Password, Button)
- [x] Register form
- [x] JWT token persisted in localStorage
- [x] Session restored on app startup (`restoreSession()`)
- [x] `authGuard` protecting all authenticated routes
- [x] `authInterceptor` attaching Bearer token to HTTP requests
- [x] Logout (clears token + currentUser from localStorage)
- [x] HTTP adapter (`auth-http.repository.ts`)
- [x] Mock adapter (`auth-mock.repository.ts`)
- [x] Unit tests for `AuthService` (login, register, restoreSession, syncAfterAuth, native/web branches)
- [x] Unit tests for guard and interceptor

## Recipes — 95%
- [x] List view with thumbnail, time, servings
- [x] Client-side filter by category (query param `?categoryId=`)
- [x] Client-side filter by favorites (query param `?favorites=true`)
- [x] Detail view (ingredients, instructions, categories, image)
- [x] Create form
- [x] Edit form (pre-populated from store)
- [x] Delete with confirmation dialog
- [x] Image upload (create + detail)
- [x] Category assignment (multi-select panel in detail)
- [x] `RecipeStore` with in-memory cache and lazy loading
- [x] HTTP adapter (getAll by user, getById, create, update, delete, uploadImage, updateCategories)
- [x] SQLite adapter (all CRUD + image filesystem cache)
- [x] Mock adapter
- [x] Unit tests for store, HTTP repo
- [ ] **Search UI** — `RecipeRepository.search()` exists in all adapters but no search input in the UI
- [ ] Sort/order control in list view

## Categories — 95%
- [x] List view with delete confirmation
- [x] Create form
- [x] Delete (cascades removal from all recipes in the store)
- [x] `CategoryStore` with lazy loading
- [x] HTTP adapter
- [x] SQLite adapter
- [x] Mock adapter
- [x] Unit tests for store
- [ ] Edit category (no edit route or form)

## Favorites — 100%
- [x] Toggle favorite from detail view
- [x] Filtered list via query param `?favorites=true`
- [x] `FavoriteService` with reactive `favoriteIds` signal
- [x] Auto-reload favorites after sync pull (`pullCompletedAt` effect)
- [x] Push to server immediately on toggle (native only)
- [x] HTTP adapter
- [x] SQLite adapter
- [x] Mock adapter
- [x] Unit tests for service and HTTP repo

## Offline Sync (Android) — 90%
- [x] `SyncService.pull()` — incremental via `?since=` parameter
- [x] `SyncService.push()` — pending_sync records for recipes, categories, favorites
- [x] `SyncService.syncOnLogin()` — wipe + full pull after login
- [x] Image caching to device filesystem during pull
- [x] Pending image upload during push
- [x] ID mapping (clientId → serverId) applied after push
- [x] SQLite DB schema v3 with migrations (v1 → v2 → v3)
- [x] `NetworkService` triggers push on reconnect, pull on app foreground
- [x] Unit tests for `SyncService`
- [ ] **`RecipeSqliteRepository.getFavorites()`** — broken SQL (wrong join column; method not called by current UI but needs fixing)
- [ ] Conflict resolution is last-write-wins; no UI for conflict notification

## Shared Infrastructure — 100%
- [x] `DatabaseService` — singleton SQLite connection lifecycle + schema migrations
- [x] `ImageCacheService` — Cache API for web image caching (blob URLs)
- [x] `NetworkService` — Capacitor Network + App plugin listeners
- [x] `AppPlugin` / `NetworkPlugin` — thin wrappers enabling unit test injection
- [x] `AppHeaderComponent` — navigation, logout, favorites toggle
- [x] `AppFooterComponent` — bottom navigation bar

## Navigation & Routing — 85%
- [x] All primary routes (recipes, detail, form, login, register, categories)
- [x] Lazy-loaded components
- [x] Auth guard on all protected routes
- [x] Default redirect `'' → /recipes`
- [ ] No 404 catch-all route (unknown URLs fall through to blank page)
- [ ] No back-navigation guard on the create/edit form (unsaved changes lost silently)

## i18n — 100%
- [x] Spanish translations complete for all visible strings
- [x] `translate` pipe used throughout templates
- [x] `TranslateService` / `provideTranslateService` configured

## Android / Capacitor — 90%
- [x] `capacitor.config.ts` configured (`appId: com.recetapps.app`)
- [x] Capacitor 8 with `@capacitor/android`
- [x] SQLite adapter functional
- [x] Image filesystem caching
- [x] Network and App state listeners
- [ ] Android icons/splash regeneration documented but not verified in CI
- [ ] No end-to-end / device tests
