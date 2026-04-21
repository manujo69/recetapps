import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { RecipeSummary } from '../../recipes/domain/recipe.model';
import { FavoriteRepository } from '../domain/favorite.repository';

@Injectable()
export class FavoriteService {
  private readonly repository = inject(FavoriteRepository);

  readonly favoriteIds = signal(new Set<number>());
  loadFavorites(): Observable<RecipeSummary[]> {
    return this.repository.getMyFavorites().pipe(
      tap((favorites) => this.favoriteIds.set(new Set(favorites.map((f) => f.id)))),
    );
  }

  isFavorite(recipeId: number): boolean {
    return this.favoriteIds().has(recipeId);
  }

  addFavorite(recipeId: number): Observable<void> {
    return this.repository.addFavorite(recipeId).pipe(
      tap(() => this.favoriteIds.update((ids) => new Set([...ids, recipeId]))),
    );
  }

  removeFavorite(recipeId: number): Observable<void> {
    return this.repository.removeFavorite(recipeId).pipe(
      tap(() => this.favoriteIds.update((ids) => { const next = new Set(ids); next.delete(recipeId); return next; })),
    );
  }
}
