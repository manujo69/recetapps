# Identified Issues and Areas for Improvement

**As of:** 2026-05-07

---

## Critical Bugs

### 1. Two failing unit tests — `DatabaseService` (schema version mismatch)
**Files:** [src/app/shared/infrastructure/database.service.spec.ts](../src/app/shared/infrastructure/database.service.spec.ts)  
**Impact:** CI failure; tests no longer reflect actual code.  

The DB was bumped to `DB_VERSION = 3` (with a `recipe_images` table rebuild migration), but the spec still asserts version 2:
- `"debe registrar upgrade statements antes de abrir la BD"` — expects `addUpgradeStatement` called with only the v2 upgrade array; actual call includes v2 + v3.
- `"debe crear la conexión y ejecutar el SCHEMA si no existe conexión previa"` — expects `createConnection(..., 2, ...)` but actual is `createConnection(..., 3, ...)`.

**Fix:** Update the spec to assert `DB_VERSION = 3` and include both migration entries in the `addUpgradeStatement` expectation.

---

### 2. `RecipeSqliteRepository.getFavorites()` — broken SQL
**File:** [src/app/recipes/infrastructure/recipe-sqlite.repository.ts:225](../src/app/recipes/infrastructure/recipe-sqlite.repository.ts#L225)  
**Impact:** Would throw or return empty set if ever called. Currently unused (the UI goes through `FavoriteService` → `FavoriteRepository.getMyFavorites()`), but the method exists on `RecipeRepository` abstract class and could cause confusion.

Two problems:
1. Join column is wrong: `JOIN favorites f ON f.recipe_client_id = r.client_id` — the `favorites` table has `recipe_id INTEGER`, not `recipe_client_id`.
2. Missing query parameter: `WHERE f.user_id = ?` with `[/* current user ID should be passed here */]` (empty array, no `user_id` column in the schema).

**Fix:** Either remove `getFavorites()` from `RecipeRepository` (it duplicates `FavoriteRepository.getMyFavorites()`), or fix the SQL: `JOIN favorites f ON f.recipe_id = r.id` and remove the `f.user_id` predicate (the favorites table is already scoped per user in the sync model).

---

## High-Priority Issues

### 3. `environment.ts` points directly to production
**File:** [src/environments/environment.ts](../src/environments/environment.ts)  
**Impact:** Any developer running `npm start` without configuration hits the live production backend. The local environment block is commented out.

```typescript
// Commented out — dev server hits production:
export const environment = {
  name: 'production',
  production: true,
  useMockApi: false,
  apiUrl: 'https://recetapps-back-production.up.railway.app',
};
```

**Fix:** Restore the local environment block in `environment.ts` and use `environment.dev.ts` or `environment.production.ts` via `fileReplacements` in `angular.json`.

---

### 4. No 404 / catch-all route
**File:** [src/app/app.routes.ts](../src/app/app.routes.ts)  
**Impact:** Any unknown URL renders a blank page with no error message.

**Fix:** Add `{ path: '**', redirectTo: 'recipes' }` (or a dedicated 404 component) as the last route.

---

## Medium-Priority Issues

### 5. Recipe search UI not implemented
**Impact:** `RecipeRepository.search()` is implemented in all three adapters (HTTP, SQLite, mock), but there is no search input in `RecipeListComponent`. Users cannot search.

### 6. Client-side recipe sort may mis-order temp IDs
**File:** [src/app/recipes/ui/recipe-list/recipe-list.component.ts:47](../src/app/recipes/ui/recipe-list/recipe-list.component.ts#L47)  
Recipes are sorted by `b.id - a.id`. In SQLite mode, newly created recipes get a negative temp ID (e.g., `-Date.now()`), so they sort to the bottom instead of the top until synced.

**Fix:** Sort by `updatedAt` descending (already available on `RecipeSummary`) or use absolute values for the temp ID comparison.

### 7. No unsaved-changes guard on recipe form
**File:** [src/app/recipes/ui/recipe-form/recipe-form.component.ts](../src/app/recipes/ui/recipe-form/recipe-form.component.ts)  
Navigating away mid-edit silently discards the form without a prompt.

**Fix:** Implement `CanDeactivate` guard that checks `form.dirty`.

### 8. Category edit not implemented
There is a "delete" action on categories but no edit/rename. The `CategoryRepository` abstract class does not even define an `update()` method, but `CategorySqliteRepository` and `CategoryHttpRepository` both implement one.

**Fix:** Expose `update()` on the abstract class and add an edit route/form.

### 9. `RecipeListComponent` loads favorites on every init
**File:** [src/app/recipes/ui/recipe-list/recipe-list.component.ts:59](../src/app/recipes/ui/recipe-list/recipe-list.component.ts#L59)  
`ngOnInit` always calls `this.favoriteService.loadFavorites()`, even when favorites are already loaded. There is no `loaded` gate in `FavoriteService`.

---

## Low-Priority / Code Quality

### 10. `DatabaseService` `@Injectable` decorator inconsistency
**File:** [src/app/shared/infrastructure/database.service.ts:66](../src/app/shared/infrastructure/database.service.ts#L66)  
`@Injectable({ providedIn: 'root' })` — but the service is also listed explicitly in `app.config.ts` providers as `SyncService` dependency. While harmless, the `providedIn: 'root'` on the shared `DatabaseService` contrasts with other services in the project that use `@Injectable()` with manual provider registration. This is intentional for the singleton pattern but worth noting.

### 11. `RecipeSqliteRepository.updateCategories()` uses deprecated `.toPromise()`
**File:** [src/app/recipes/infrastructure/recipe-sqlite.repository.ts:259](../src/app/recipes/infrastructure/recipe-sqlite.repository.ts#L259)  
```typescript
return this.getById(recipeId).toPromise() as Promise<Recipe>;
```
`toPromise()` is deprecated in RxJS 7+. Use `firstValueFrom()` instead.

### 12. `RecipeDetailComponent` — `recipeId` uses snapshot, not observable
**File:** [src/app/recipes/ui/recipe-detail/recipe-detail.component.ts:56](../src/app/recipes/ui/recipe-detail/recipe-detail.component.ts#L56)  
```typescript
private readonly recipeId = computed(() => Number(this.route.snapshot.paramMap.get('id')));
```
`route.snapshot` does not update on same-component navigation. This is fine for the current routing structure but fragile.

### 13. Comment-driven empty array in `getFavorites()` query
**File:** [src/app/recipes/infrastructure/recipe-sqlite.repository.ts:235](../src/app/recipes/infrastructure/recipe-sqlite.repository.ts#L235)  
`[/* current user ID should be passed here */]` — placeholder comment with empty params array. This would cause a runtime SQL error if the method were ever called.
