# Project Structure

**As of:** 2026-05-07  
**Branch:** `feature/android-version`

---

## Directory Tree (source files only)

```
src/
├── app/
│   ├── app.config.ts          ← DI wiring, adapter selection, app initializer
│   ├── app.html
│   ├── app.routes.ts          ← Route definitions (lazy-loaded)
│   ├── app.scss
│   ├── app.spec.ts
│   ├── app.ts
│   │
│   ├── auth/
│   │   ├── application/
│   │   │   ├── auth.service.spec.ts
│   │   │   └── auth.service.ts         ← Login, register, session, syncAfterAuth
│   │   ├── domain/
│   │   │   ├── auth.model.ts
│   │   │   └── auth.repository.ts      ← Port (abstract)
│   │   ├── infrastructure/
│   │   │   ├── auth.guard.spec.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── auth-http.repository.ts
│   │   │   ├── auth.interceptor.spec.ts
│   │   │   ├── auth.interceptor.ts
│   │   │   └── auth-mock.repository.ts
│   │   └── ui/
│   │       ├── login/
│   │       │   ├── login.component.html
│   │       │   ├── login.component.scss
│   │       │   ├── login.component.spec.ts
│   │       │   └── login.component.ts
│   │       └── register/
│   │           ├── register.component.html
│   │           ├── register.component.scss
│   │           ├── register.component.spec.ts
│   │           └── register.component.ts
│   │
│   ├── categories/
│   │   ├── application/
│   │   │   ├── category.service.ts     ← Thin wrapper (unused?)
│   │   │   ├── category.store.spec.ts
│   │   │   └── category.store.ts       ← signalStore with create/delete/reset
│   │   ├── domain/
│   │   │   ├── category.model.ts
│   │   │   └── category.repository.ts
│   │   ├── infrastructure/
│   │   │   ├── category-http.repository.ts
│   │   │   ├── category-mock.repository.ts
│   │   │   ├── category-sqlite.repository.ts
│   │   │   └── category-sqlite.types.ts
│   │   └── ui/
│   │       ├── category-add/
│   │       │   ├── category-add.component.html
│   │       │   ├── category-add.component.scss
│   │       │   └── category-add.component.ts
│   │       └── category-list/
│   │           ├── category-list.component.html
│   │           ├── category-list.component.scss
│   │           └── category-list.component.ts
│   │
│   ├── favorites/
│   │   ├── application/
│   │   │   ├── favorite.service.spec.ts
│   │   │   └── favorite.service.ts     ← favoriteIds signal, pullCompletedAt effect
│   │   ├── domain/
│   │   │   └── favorite.repository.ts
│   │   └── infrastructure/
│   │       ├── favorite-http.repository.spec.ts
│   │       ├── favorite-http.repository.ts
│   │       ├── favorite-mock.repository.ts
│   │       ├── favorite-sqlite.repository.ts
│   │       └── favorite-sqlite.types.ts
│   │
│   ├── recipes/
│   │   ├── application/
│   │   │   ├── recipe.service.ts       ← Exists but not registered (unused)
│   │   │   ├── recipe.store.spec.ts
│   │   │   └── recipe.store.ts         ← signalStore, in-memory cache, full CRUD
│   │   ├── domain/
│   │   │   ├── recipe.model.spec.ts
│   │   │   ├── recipe.model.ts
│   │   │   └── recipe.repository.ts
│   │   ├── infrastructure/
│   │   │   ├── recipe-http.repository.spec.ts
│   │   │   ├── recipe-http.repository.ts
│   │   │   ├── recipe-mock.repository.ts
│   │   │   ├── recipe-sqlite.repository.ts  ← getFavorites() has broken SQL ⚠️
│   │   │   └── recipe-sqlite.types.ts
│   │   └── ui/
│   │       ├── recipe-detail/
│   │       │   ├── recipe-detail.component.html
│   │       │   ├── recipe-detail.component.scss
│   │       │   ├── recipe-detail.component.spec.ts
│   │       │   └── recipe-detail.component.ts
│   │       ├── recipe-form/
│   │       │   ├── recipe-form.component.html
│   │       │   ├── recipe-form.component.scss
│   │       │   ├── recipe-form.component.spec.ts
│   │       │   └── recipe-form.component.ts
│   │       ├── recipe-image/
│   │       │   ├── recipe-image.component.html
│   │       │   ├── recipe-image.component.scss
│   │       │   ├── recipe-image.component.spec.ts
│   │       │   └── recipe-image.component.ts
│   │       ├── recipe-ingredients/
│   │       │   ├── recipe-ingredients.component.html
│   │       │   ├── recipe-ingredients.component.scss
│   │       │   ├── recipe-ingredients.component.spec.ts
│   │       │   └── recipe-ingredients.component.ts
│   │       ├── recipe-instructions/
│   │       │   ├── recipe-instructions.component.html
│   │       │   ├── recipe-instructions.component.scss
│   │       │   ├── recipe-instructions.component.spec.ts
│   │       │   └── recipe-instructions.component.ts
│   │       ├── recipe-list/
│   │       │   ├── recipe-list.component.html
│   │       │   ├── recipe-list.component.scss
│   │       │   ├── recipe-list.component.spec.ts
│   │       │   └── recipe-list.component.ts
│   │       └── recipe-panel/
│   │           ├── recipe-panel.component.html
│   │           ├── recipe-panel.component.scss
│   │           ├── recipe-panel.component.spec.ts
│   │           └── recipe-panel.component.ts
│   │
│   ├── shared/
│   │   ├── infrastructure/
│   │   │   ├── app-plugin.ts           ← Capacitor App plugin wrapper
│   │   │   ├── database.service.spec.ts ← 2 tests FAILING ⚠️
│   │   │   ├── database.service.ts     ← SQLite lifecycle, schema v3
│   │   │   ├── image-cache.service.spec.ts
│   │   │   ├── image-cache.service.ts  ← Cache API for web
│   │   │   ├── network-plugin.spec.ts
│   │   │   ├── network-plugin.ts       ← Capacitor Network plugin wrapper
│   │   │   ├── network.service.spec.ts
│   │   │   └── network.service.ts      ← Online signal, sync on reconnect/foreground
│   │   └── ui/
│   │       ├── app-footer/
│   │       │   ├── app-footer.component.html
│   │       │   ├── app-footer.component.scss
│   │       │   └── app-footer.component.ts
│   │       └── app-header/
│   │           ├── app-header.component.html
│   │           ├── app-header.component.scss
│   │           ├── app-header.component.spec.ts
│   │           └── app-header.component.ts
│   │
│   └── sync/
│       └── application/
│           ├── sync.service.spec.ts
│           ├── sync.service.ts         ← pull/push/syncOnLogin, image caching
│           └── sync.types.ts
│
├── environments/
│   ├── environment.dev.ts
│   ├── environment.production.ts
│   └── environment.ts              ← ⚠️ Currently set to production!
├── index.html
├── main.ts
└── styles.css

public/
├── i18n/
│   └── es.json                     ← All Spanish translations
└── images/                         ← Static assets

android/                            ← Capacitor Android project (excluded from scan)
openapi.json                        ← Backend API spec (authoritative reference)
capacitor.config.ts
angular.json
karma.conf.js
package.json
eslint.config.js
```

---

## Notable Relationships

- **`app.config.ts`** is the single place that selects adapters (mock / HTTP / SQLite) based on `environment.useMockApi` and `Capacitor.isNativePlatform()`.
- **`SyncService`** is a cross-cutting concern: it depends on `DatabaseService` and `HttpClient`. It is called by `AuthService` (post-login), `NetworkService` (reconnect / foreground), and `CategoryStore.delete()` (native).
- **`FavoriteService`** reacts to `NetworkService.pullCompletedAt` to reload favorites after every sync pull.
- **`RecipeStore`** and **`CategoryStore`** both expose `reset()` — called by `AuthService` after login to clear stale data from a previous user.

---

## Files Added Since Last Analysis

This is the first analysis run; no prior baseline exists.
