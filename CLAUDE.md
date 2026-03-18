# CLAUDE.md

Guidelines for AI agents working on this codebase.

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
    # TODO: add feature folders here (e.g. recipes/, shared/)
  main.ts
  styles.css
public/               # Static assets
```

## Guidelines for Agents

- Do not switch to zoneless change detection without explicit instruction.
- Do not introduce NgModules — this project uses standalone components exclusively.
- Do not add dependencies without confirming with the user.
- Keep components small and focused. Extract services for business logic.
- Write unit tests for new services and components using Jasmine/Karma.
- Do not modify `angular.json` or `tsconfig*.json` without explicit instruction.
- Prefer `signal()` and `computed()` over RxJS for local component state; use RxJS for async/HTTP flows.
