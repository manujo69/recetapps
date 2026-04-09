import { inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Recipe, RecipeImage, RecipeSummary } from '../domain/recipe.model';
import { RecipeRepository } from '../domain/recipe.repository';

@Injectable()
export class RecipeService {
  private readonly repository = inject(RecipeRepository);

  readonly recipes = signal<RecipeSummary[]>([]);
  readonly selectedRecipe = signal<Recipe | null>(null);
  readonly loaded = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly recipeCache = new Map<number, Recipe>();


  loadAll(): void {
    if (this.loaded()) return;
    this.loading.set(true);
    this.error.set(null);
    this.repository
      .getAll()
      .pipe(
        tap((recipes) => {
          this.recipes.set(recipes);
          this.loaded.set(true);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.error.set(err.message ?? 'Error al cargar recetas');
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  loadById(id: number): void {
    const cached = this.recipeCache.get(id);
    if (cached) {
      this.selectedRecipe.set(cached);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.repository
      .getById(id)
      .pipe(
        tap((recipe) => {
          this.recipeCache.set(recipe.id!, recipe);
          this.selectedRecipe.set(recipe);
          this.loading.set(false);
        }),
        catchError((err) => {
          this.error.set(err.message ?? 'Receta no encontrada');
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }

  create(recipe: Recipe): Observable<Recipe> {
    this.loading.set(true);
    this.error.set(null);
    return this.repository.create(recipe).pipe(
      tap((newRecipe) => {
        this.selectedRecipe.set(newRecipe);
        this.loaded.set(false);
        this.loading.set(false);
      }),
      catchError((err) => {
        this.error.set(err.message ?? 'Error al crear receta');
        this.loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  uploadImage(recipeId: number, file: File): Observable<RecipeImage> {
    this.loading.set(true);
    return this.repository.uploadImage(recipeId, file).pipe(
      tap((image) => {
        const current = this.selectedRecipe();
        this.loading.set(false);
        if (current) {
          this.selectedRecipe.set({ ...current, images: [image, ...(current.images ?? [])] });
        }
      }),
      catchError((err) => {
        this.loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  clearSelected(): void {
    this.selectedRecipe.set(null);
  }
}
