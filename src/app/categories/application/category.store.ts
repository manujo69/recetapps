import { inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, Observable, pipe, switchMap, tap, catchError, throwError } from 'rxjs';
import { Category } from '../domain/category.model';
import { CategoryRepository } from '../domain/category.repository';
import { RecipeStore } from '../../recipes/application/recipe.store';
import { SyncService } from '../../sync/application/sync.service';

interface CategoryState {
  categories: Category[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loaded: false,
  loading: false,
  error: null,
};

export const CategoryStore = signalStore(
  withState(initialState),
  withMethods((store, repository = inject(CategoryRepository), recipeStore = inject(RecipeStore), syncService = inject(SyncService)) => {
    const fetchAll = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          repository.getAll().pipe(
            tap((categories) => patchState(store, { categories, loaded: true, loading: false })),
            catchError((err) => {
              patchState(store, { error: err.message ?? 'Error al cargar categorías', loading: false });
              return EMPTY;
            }),
          ),
        ),
      ),
    );

    return {
      loadAll(): void {
        if (store.loaded()) return;
        fetchAll();
      },

      create(category: Category): Observable<Category> {
        return repository.create(category).pipe(
          tap((created) =>
            patchState(store, { categories: [...store.categories(), created], loaded: true }),
          ),
          catchError((err) => throwError(() => err)),
        );
      },

      delete(id: number): Observable<void> {
        return repository.delete(id).pipe(
          tap(() => {
            patchState(store, { categories: store.categories().filter((c) => c.id !== id) });
            recipeStore.removeCategoryFromAll(id);
            if (Capacitor.isNativePlatform()) {
              syncService.push().catch(() => { console.error('Sync push failed after category delete'); });
            }
          }),
          catchError((err) => throwError(() => err)),
        );
      },

      reset(): void {
        patchState(store, initialState);
      },
    };
  }),
);
