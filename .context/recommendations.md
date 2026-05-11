# Recommendations

**As of:** 2026-05-07

Ordered by impact and effort.

---

## Immediate (Before Next Commit)

### Fix the 2 failing unit tests
Update `database.service.spec.ts` to expect `DB_VERSION = 3` and include both the v2 and v3 migration entries in the `addUpgradeStatement` assertion. This is a one-file, low-effort fix that restores green CI.

### Fix or remove `RecipeSqliteRepository.getFavorites()`
The method has broken SQL and is not called anywhere in the UI. Either:
- **Option A (preferred):** Remove `getFavorites()` from `RecipeRepository` abstract class and all implementations. The favorites feature already works correctly via `FavoriteRepository.getMyFavorites()`.
- **Option B:** Fix the SQL: change `f.recipe_client_id` → `f.recipe_id` and remove the bogus `f.user_id` predicate.

---

## Short-Term (Before Release)

### Restore the local development environment
Un-comment the dev environment block in `environment.ts` (or re-wire via `angular.json` `fileReplacements`) so `npm start` does not hit the production backend. Consider using `environment.dev.ts` for local development with `useMockApi: true` as a safe default.

### Add a 404 catch-all route
Add `{ path: '**', redirectTo: 'recipes' }` as the last entry in `app.routes.ts`. This prevents blank-page dead ends on unknown URLs.

### Implement recipe search UI
Add a search input to `RecipeListComponent`. The backend (`GET /recipes/search?keyword=`) and all adapters already support it. A simple debounced input connected to a new `search(keyword)` method on `RecipeStore` would complete this feature.

### Fix recipe list sort for temp IDs (SQLite)
In `recipe-list.component.ts`, replace `b.id - a.id` with a sort on `updatedAt` descending:
```typescript
.sort((a, b) => (b.updatedAt ?? '') > (a.updatedAt ?? '') ? 1 : -1)
```
This ensures newly created offline recipes appear at the top immediately.

---

## Medium-Term (Polish & Hardening)

### Add an unsaved-changes guard to the recipe form
Implement a `CanDeactivateFn` that checks `form.dirty` before leaving `RecipeFormComponent`. Angular Router will call it on back navigation, link clicks, and browser back-button presses.

### Implement category editing
The SQLite and HTTP adapters both have `update()` but it's not on the abstract class. Add it to `CategoryRepository`, add a route `categories/:id/edit`, and build the edit form (reuse `CategoryAddComponent` template in edit mode).

### Replace `.toPromise()` with `firstValueFrom()`
In `RecipeSqliteRepository.updateCategories()`, replace the deprecated `.toPromise()` call:
```typescript
return firstValueFrom(this.getById(recipeId));
```

### Add a loaded gate to `FavoriteService`
Expose a `loaded` signal in `FavoriteService` and skip the HTTP call in `RecipeListComponent.ngOnInit()` if favorites are already loaded. This prevents a redundant round-trip every time the list component reinitializes.

---

## Long-Term

### Add E2E tests (Cypress or Playwright)
The unit test suite covers 334 specs at 99.4%. The missing layer is end-to-end tests that verify the golden path: login → create recipe → upload image → assign category → favorite → sync → logout. Without these, mobile regressions can only be caught manually.

### Consider a global error/offline UI indicator
`NetworkService.isOnline` is available as a signal but nothing in the UI currently reads it. An offline banner (e.g., in `AppHeaderComponent`) would improve the native UX when the device has no connectivity.

### Search within categories
The `RecipeListComponent` already filters by `categoryId` via query params. Combining search + category filter in a single UX would be a natural next step once the search input is built.
