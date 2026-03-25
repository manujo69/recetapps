# CLAUDE.md

Guidelines for AI agents working on this codebase.

## API Reference

The file `openapi.json` (project root) is the authoritative reference for the backend API: endpoints, request/response schemas, authentication, and data models. Always consult it when working with backend-related functionality.

## Project Overview

Angular 20 application (recipe-app). Uses standalone components, Angular Router, and Zone.js-based change detection.

## Tech Stack

- **Framework**: Angular 20 (standalone components, no NgModules)
- **Language**: TypeScript 5.9
- **Change detection**: Zone.js (`provideZoneChangeDetection`)
- **Routing**: Angular Router
- **Forms**: Angular Forms
- **Testing**: Karma + Jasmine
- **Build**: Angular CLI / esbuild (`@angular/build:application`)
- **Formatting**: Prettier (printWidth: 100, singleQuote: true)

## Commands

```bash
npm start          # Dev server (ng serve)
npm run build      # Production build
npm test           # Unit tests (Karma)
npm run watch      # Build in watch mode (development)
```

## Conventions

- **Components**: Standalone, class name matches selector in PascalCase (e.g. `app-recipe-card` → `RecipeCard`)
- **Files**: Angular naming convention — `feature-name.component.ts`, `feature-name.service.ts`, etc.
- **State**: Prefer Angular `signal()` over class properties for reactive state
- **Formatting**: Run Prettier before committing. Config is in `package.json`
- **Imports**: Use `@angular/core`, `@angular/common`, etc. — no barrel files unless already present
- **Translations**: Use `ngx-translate` v17. Translation files live in `public/i18n/<lang>.json`. Use the `translate` pipe in templates (`{{ 'key' | translate }}`) or `TranslateService` in TS. Default language is `es`.
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
    app.config.ts       # App-level providers
    app.routes.ts       # Route definitions
    <feature>/
      domain/           # Models + ports (abstract classes)
      application/      # Use cases (services)
      infrastructure/   # Adapters (HTTP, mock, etc.)
      ui/               # Standalone components
    shared/
      ui/               # Reusable components with no feature dependency
  main.ts
  styles.css
public/               # Static assets
```

## Hexagonal Architecture (Ports & Adapters)

Every feature follows a strict four-layer structure. All layers are inside `src/app/<feature>/`.

### Layers

**1. Domain** (`domain/`)
- `<feature>.model.ts` — pure TypeScript interfaces / value objects. No Angular, no RxJS, no framework dependencies.
- `<feature>.repository.ts` — the **port**: an `abstract class` that defines the contract between application and infrastructure. Components and services only ever reference this abstract class, never a concrete implementation.

**2. Application** (`application/`)
- `<feature>.service.ts` — **use case orchestrator**. Injected with the port via `inject(FeatureRepository)`. Coordinates domain logic, applies side effects (e.g. `tap` for storing tokens), and exposes reactive state via `signal()` / `computed()` when needed. Never imports from `infrastructure/` or `ui/`.

**3. Infrastructure** (`infrastructure/`)
- `<feature>-http.repository.ts` — production adapter. Extends the abstract repository and calls the real HTTP API.
- `<feature>-mock.repository.ts` — development/test adapter. Extends the same abstract repository and returns in-memory data.
- Other adapters (WebSocket, localStorage, etc.) follow the same `<feature>-<transport>.repository.ts` naming.

**4. UI** (`ui/`)
- One subfolder per component (`ui/<feature-screen>/`).
- Components inject the **application service**, never the repository or infrastructure directly.
- Local state uses `signal()` and `computed()`; async flows use RxJS (`Observable` returned by the service).

### Dependency Injection wiring

Adapters are registered in `app.config.ts` using the `useClass` token:

```typescript
{ provide: RecipeRepository, useClass: environment.useMockApi ? RecipeMockRepository : RecipeHttpRepository },
RecipeService,
```

This is the only place in the codebase that knows which adapter is active. Swapping from HTTP to mock (or any future transport) requires changing only this one line.

### Dependency rules (strict)

| Layer | May depend on | Must NOT depend on |
|---|---|---|
| Domain | nothing | Application, Infrastructure, UI, Angular |
| Application | Domain | Infrastructure, UI |
| Infrastructure | Domain | Application, UI |
| UI | Application, Domain (models only) | Infrastructure |

### Adding a new feature — checklist

1. Create `src/app/<feature>/domain/<feature>.model.ts` with interfaces.
2. Create `src/app/<feature>/domain/<feature>.repository.ts` as an `abstract class`.
3. Create `src/app/<feature>/application/<feature>.service.ts` injecting the abstract class.
4. Create at least one adapter in `infrastructure/` that `extends` the abstract class.
5. Register the chosen adapter in `app.config.ts` via `{ provide: FeatureRepository, useClass: ... }`.
6. Build UI components under `ui/` that inject only the application service.
7. Write unit tests for the service and each adapter independently.

## Guidelines for Agents

- Do not switch to zoneless change detection without explicit instruction.
- Do not introduce NgModules — this project uses standalone components exclusively.
- Do not add dependencies without confirming with the user.
- Keep components small and focused. Extract services for business logic.
- Write unit tests for new services and components using Jasmine/Karma.
- Do not modify `angular.json` or `tsconfig*.json` without explicit instruction.
- Prefer `signal()` and `computed()` over RxJS for local component state; use RxJS for async/HTTP flows.
