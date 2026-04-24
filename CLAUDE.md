# CLAUDE.md

Guidelines for AI agents working on this codebase.

## API Reference

The file `openapi.json` (project root) is the authoritative reference for the backend API: endpoints, request/response schemas, authentication, and data models. Always consult it when working with backend-related functionality.

## Project Overview

Angular 20 hybrid application (web + Android). Uses standalone components, Angular Router, Zone.js-based change detection, and Capacitor 8 for native mobile support.

## Tech Stack

- **Framework**: Angular 20 (standalone components, no NgModules)
- **Language**: TypeScript 5.9
- **Change detection**: Zone.js (`provideZoneChangeDetection`)
- **Routing**: Angular Router
- **Forms**: Angular Forms
- **State management**: `@ngrx/signals` v20 (`signalStore`) for feature stores; `signal()` / `computed()` for local component state
- **UI components**: PrimeNG 20 (Aura theme) + Tailwind CSS 4
- **i18n**: `ngx-translate` v17. Default language: `es`
- **Mobile**: Capacitor 8 (`@capacitor/core`, `@capacitor/android`)
- **Local DB**: `@capacitor-community/sqlite` (native only)
- **Testing**: Karma + Jasmine
- **Build**: Angular CLI / esbuild (`@angular/build:application`)
- **Formatting**: Prettier (printWidth: 100, singleQuote: true). Config in `package.json`

## Commands

```bash
npm start          # Dev server (ng serve)
npm run build      # Production build
npm test           # Unit tests (Karma)
npm run watch      # Build in watch mode (development)
npx cap sync       # Sync web build to native platforms
npx cap open android  # Open Android project in Android Studio
npx @capacitor/assets generate --android  # Regenerate Android icons from resources/icon.png
```

### Regenerating Android icons

Place a square PNG (≥ 1024×1024 px, no transparency) at `resources/icon.png` in the project root, then run `npx @capacitor/assets generate --android`. This overwrites all `mipmap-*/ic_launcher*.png` files in `android/app/src/main/res/`.

## Conventions

- **Components**: Standalone, class name matches selector in PascalCase (e.g. `app-recipe-card` → `RecipeCard`)
- **Files**: Angular naming convention — `feature-name.component.ts`, `feature-name.service.ts`, etc.
- **State**: Use `@ngrx/signals` `signalStore` for feature-level reactive state; prefer `signal()` and `computed()` for local component state; use RxJS for async/HTTP flows
- **Formatting**: Run Prettier before committing
- **Imports**: Use `@angular/core`, `@angular/common`, etc. — no barrel files unless already present
- **Translations**: Use the `translate` pipe in templates (`{{ 'key' | translate }}`) or `TranslateService` in TS. Translation files live in `public/i18n/<lang>.json`
- **CSS**: Use BEM (Block Element Modifier) methodology for all class names
  - Block: `.recipe-card`
  - Element: `.recipe-card__title`, `.recipe-card__image`
  - Modifier: `.recipe-card--featured`, `.recipe-card__title--large`
  - Use component selector as the BEM block name

## Project Structure

```
src/
  app/
    app.ts              # Root component
    app.config.ts       # App-level providers (adapter selection, app initializer)
    app.routes.ts       # Route definitions
    <feature>/
      domain/           # Models + ports (abstract classes)
      application/      # Use cases (service or signalStore)
      infrastructure/   # Adapters (HTTP, SQLite, mock)
      ui/               # Standalone components
    shared/
      infrastructure/   # Cross-cutting services (NetworkService, DatabaseService)
      ui/               # Reusable components with no feature dependency
    sync/
      application/      # SyncService (no domain/infrastructure layers — cross-cutting)
  main.ts
  styles.css
public/               # Static assets (i18n/, images/)
android/              # Capacitor Android project
capacitor.config.ts   # Capacitor config (appId: com.recetapps.app)
```

## Hexagonal Architecture (Ports & Adapters)

Every feature follows a strict four-layer structure. All layers are inside `src/app/<feature>/`.

### Layers

**1. Domain** (`domain/`)
- `<feature>.model.ts` — pure TypeScript interfaces / value objects. No Angular, no RxJS, no framework dependencies.
- `<feature>.repository.ts` — the **port**: an `abstract class` that defines the contract between application and infrastructure. Components and services only ever reference this abstract class, never a concrete implementation.

**2. Application** (`application/`)

Two patterns are used depending on feature complexity:

- `<feature>.service.ts` — **use case orchestrator** (`@Injectable`). Injected with the port via `inject(FeatureRepository)`. Used for auth, favorites.
- `<feature>.store.ts` — **signal store** created with `signalStore` from `@ngrx/signals`. Exposes reactive state as signals and async methods via `withMethods`. Used for recipes, categories.

Neither pattern may import from `infrastructure/` or `ui/`.

**3. Infrastructure** (`infrastructure/`)

Three adapter types per feature:

- `<feature>-mock.repository.ts` — dev/test adapter with in-memory data
- `<feature>-http.repository.ts` — web production adapter (REST API calls)
- `<feature>-sqlite.repository.ts` — native/Android production adapter (Capacitor SQLite)

All extend the same abstract repository from `domain/`.

**4. UI** (`ui/`)
- One subfolder per component (`ui/<feature-screen>/`).
- Components inject the **application service or store**, never the repository or infrastructure directly.
- Local state uses `signal()` and `computed()`; async flows use RxJS (`Observable` returned by the service/store).

### Dependency Injection wiring

Adapters are selected in `app.config.ts` via factory functions that check `environment.useMockApi` and `Capacitor.isNativePlatform()`:

```typescript
function recipeAdapter() {
  if (environment.useMockApi) return RecipeMockRepository;
  return native ? RecipeSqliteRepository : RecipeHttpRepository;
}

// In providers:
{ provide: RecipeRepository, useClass: recipeAdapter() },
RecipeStore,
```

- `useMockApi = true` → mock (in-memory)
- Native platform (Android) → SQLite adapter
- Otherwise → HTTP adapter

`AuthRepository` has no SQLite adapter — it always uses mock or HTTP.

This is the only place in the codebase that knows which adapter is active.

### App initializer

`app.config.ts` registers a `provideAppInitializer` that runs on startup:
1. Restores the auth session from `localStorage` (`authService.restoreSession()`)
2. On native platforms, if authenticated, pulls incremental sync from the server (`syncService.pull(since)`)

### Dependency rules (strict)

| Layer | May depend on | Must NOT depend on |
|---|---|---|
| Domain | nothing | Application, Infrastructure, UI, Angular |
| Application | Domain | Infrastructure, UI |
| Infrastructure | Domain | Application, UI |
| UI | Application, Domain (models only) | Infrastructure |

### Cross-cutting services (exceptions to the feature pattern)

- **`sync/application/SyncService`** — no domain/infrastructure layers. Handles full pull/push sync with the server and local SQLite DB. Called by `AuthService` after login and by `NetworkService` on reconnect.
- **`shared/infrastructure/NetworkService`** — monitors network connectivity via `@capacitor/network`. Triggers `SyncService.push()` on reconnect (native only).
- **`shared/infrastructure/DatabaseService`** — manages the SQLite connection lifecycle via `@capacitor-community/sqlite`. Used by all SQLite adapters and `SyncService`.

### AuthService post-auth flow (`syncAfterAuth`)

After every `login()` or `register()`, `AuthService` runs `syncAfterAuth()` before emitting the result:

- **Web**: resets `RecipeStore` and `CategoryStore` immediately (no sync).
- **Native**: calls `syncService.syncOnLogin()` (wipes local user data, then does a full pull). Sync errors are caught and silenced so the login observable always completes. Stores are reset after sync regardless of outcome.

This is why `AuthService` injects `RecipeStore` and `CategoryStore` — do not remove those dependencies.

### Adding a new feature — checklist

1. Create `src/app/<feature>/domain/<feature>.model.ts` with interfaces.
2. Create `src/app/<feature>/domain/<feature>.repository.ts` as an `abstract class`.
3. Create application layer: `<feature>.service.ts` (simple) or `<feature>.store.ts` (`signalStore`) injecting the abstract class.
4. Create adapters in `infrastructure/`: `-mock`, `-http`, and `-sqlite` if needed.
5. Add a factory function in `app.config.ts` and register the provider.
6. Build UI components under `ui/` that inject only the application service/store.
7. Write unit tests for the service/store and each adapter independently.

## Guidelines for Agents

- Do not switch to zoneless change detection without explicit instruction.
- Do not introduce NgModules — this project uses standalone components exclusively.
- Do not add dependencies without confirming with the user.
- Keep components small and focused. Extract services/stores for business logic.
- Write unit tests for new services and components using Jasmine/Karma.
- Do not modify `angular.json` or `tsconfig*.json` without explicit instruction.
- Do not modify `capacitor.config.ts` or the `android/` project without explicit instruction.
- Prefer `signalStore` (`@ngrx/signals`) for feature-level state. Use `signal()` / `computed()` for local component state. Use RxJS for async/HTTP flows only.
- When writing tests for services that depend on `SyncService` or `NetworkService`, always provide spies for them — they have deep dependency chains that must not be instantiated in tests.

### Unit test dependency map

Services have non-obvious transitive dependencies that must be mocked explicitly:

| Service under test | Required spies |
|---|---|
| `AuthService` | `AuthRepository` (`login`, `register`), `SyncService` (`syncOnLogin`), `RecipeStore` (`reset`), `CategoryStore` (`reset`) |
| `SyncService` | `DatabaseService` (`getDb`, `clearUserData`), `HttpClient` (via `provideHttpClient` + `provideHttpClientTesting`) |

### fakeAsync and HTTP timing

When a service `await`s a non-HTTP async call **before** making an HTTP request, `httpTesting.expectOne()` will fail because the request hasn't been queued yet. Use `fakeAsync` + `flushMicrotasks()` to control execution order:

```typescript
it('example', fakeAsync(() => {
  service.methodThatAwaitsBeforeHttp().catch(() => {});
  flushMicrotasks(); // resolves preceding awaits, queues the HTTP request
  httpTesting.expectOne(URL).flush(response);
  flushMicrotasks(); // resolves the rest of the async chain
  expect(...);
}));
```

This pattern is required for `syncOnLogin()` tests because it awaits `clearUserData()` before calling `pull()` (which makes the HTTP request).
