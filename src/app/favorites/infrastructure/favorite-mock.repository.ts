import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { RecipeSummary } from '../../recipes/domain/recipe.model';
import { FavoriteRepository } from '../domain/favorite.repository';

@Injectable()
export class FavoriteMockRepository extends FavoriteRepository {
  private readonly favorites = new Set<number>();

  getMyFavorites(): Observable<RecipeSummary[]> {
    return of([]);
  }

  isFavorite(recipeId: number): Observable<boolean> {
    return of(this.favorites.has(recipeId));
  }

  addFavorite(recipeId: number): Observable<void> {
    this.favorites.add(recipeId);
    return of(undefined);
  }

  removeFavorite(recipeId: number): Observable<void> {
    this.favorites.delete(recipeId);
    return of(undefined);
  }
}
