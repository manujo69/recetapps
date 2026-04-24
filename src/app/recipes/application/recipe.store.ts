import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, pipe, switchMap, tap, catchError, throwError } from 'rxjs';
import { Recipe, RecipeImage, RecipeSummary } from '../domain/recipe.model';
import { RecipeRepository } from '../domain/recipe.repository';

interface RecipeState {
  recipes: RecipeSummary[];
  selectedRecipe: Recipe | null;
  loaded: boolean; // ¿se ha cargado la lista completa alguna vez?
  loading: boolean;
  error: string | null;
}

const initialState: RecipeState = {
  recipes: [],
  selectedRecipe: null,
  loaded: false,
  loading: false,
  error: null,
};

export const RecipeStore = signalStore(
  withState(initialState),
  withMethods((store, repository = inject(RecipeRepository)) => {
    const recipeCache = new Map<number, Recipe>();

    // rxMethod privado: ejecuta la llamada HTTP getAll()
    const fetchAll = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          repository.getAll().pipe(
            tap((recipes) => patchState(store, { recipes, loaded: true, loading: false })),
            catchError((err) => {
              patchState(store, { error: err.message ?? 'Error al cargar recetas', loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    // rxMethod privado: ejecuta la llamada HTTP getById()
    const fetchById = rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          repository.getById(id).pipe(
            tap((recipe) => {
              recipeCache.set(recipe.id!, recipe);
              patchState(store, { selectedRecipe: recipe, loading: false });
            }),
            catchError((err) => {
              patchState(store, { error: err.message ?? 'Receta no encontrada', loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return {
      // Carga la lista. Si ya está en el store, no hace HTTP.
      loadAll(): void {
        if (store.loaded()) return;
        fetchAll();
      },

      // Carga una receta por id. Si ya está en caché, la usa sin llamar al backend.
      loadById(id: number): void {
        const cached = recipeCache.get(id);
        if (cached) {
          patchState(store, { selectedRecipe: cached });
          return;
        }
        fetchById(id);
      },

      // Actualiza una receta y refresca el estado del store y la caché.
      update(id: number, recipe: Recipe): Observable<Recipe> {
        return repository.update(id, recipe).pipe(
          tap((updated) => {
            recipeCache.set(updated.id!, updated);
            patchState(store, { selectedRecipe: updated });
          }),
          catchError((err) => throwError(() => err)),
        );
      },

      // Reemplaza las categorías de una receta via PATCH /recipes/{id}/categories.
      updateCategories(recipeId: number, categoryIds: number[]): Observable<Recipe> {
        return repository.updateCategories(recipeId, categoryIds).pipe(
          tap((updated) => {
            recipeCache.set(updated.id!, updated);
            patchState(store, {
              selectedRecipe: updated,
              recipes: store.recipes().map((r) =>
                r.id === updated.id ? { ...r, categoryIds: updated.categoryIds ?? [] } : r,
              ),
            });
          }),
          catchError((err) => throwError(() => err)),
        );
      },

      // Crea una receta e invalida la caché para forzar reload en el próximo loadAll().
      create(recipe: Recipe): Observable<Recipe> {
        patchState(store, { loading: true, error: null });
        return repository.create(recipe).pipe(
          tap((newRecipe) =>
            patchState(store, {
              selectedRecipe: newRecipe,
              loaded: false, // invalida caché
              loading: false,
            }),
          ),
          catchError((err) => {
            patchState(store, { error: err.message ?? 'Error al crear receta', loading: false });
            return throwError(() => err);
          }),
        );
      },

      // Sube una imagen y actualiza la receta seleccionada en el store.
      uploadImage(recipeId: number, file: File): Observable<RecipeImage> {
        return repository.uploadImage(recipeId, file).pipe(
          tap((image) => {
            const current = store.selectedRecipe();
            if (current) {
              const updated = { ...current, images: [image, ...(current.images ?? [])] };
              recipeCache.set(current.id!, updated);
              patchState(store, { selectedRecipe: updated });
            }
          }),
          catchError((err) => throwError(() => err)),
        );
      },

      delete(id: number): Observable<void> {
        return repository.delete(id).pipe(
          tap(() => {
            recipeCache.delete(id);
            patchState(store, {
              selectedRecipe: null,
              recipes: store.recipes().filter((r) => r.id !== id),
              loaded: false,
            });
          }),
          catchError((err) => throwError(() => err)),
        );
      },

      clearSelected(): void {
        patchState(store, { selectedRecipe: null });
      },

      reset(): void {
        recipeCache.clear();
        patchState(store, initialState);
      },
    };
  }),
);
