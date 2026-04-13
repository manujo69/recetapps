import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RecipeSummary } from '../../recipes/domain/recipe.model';
import { FavoriteRepository } from '../domain/favorite.repository';

@Injectable()
export class FavoriteService {
  private readonly repository = inject(FavoriteRepository);

  getMyFavorites(): Observable<RecipeSummary[]> {
    return this.repository.getMyFavorites();
  }

  isFavorite(recipeId: number): Observable<boolean> {
    return this.repository.isFavorite(recipeId);
  }

  addFavorite(recipeId: number): Observable<void> {
    return this.repository.addFavorite(recipeId);
  }

  removeFavorite(recipeId: number): Observable<void> {
    return this.repository.removeFavorite(recipeId);
  }
}
