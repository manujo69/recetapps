import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { RecipeSummary } from '../../recipes/domain/recipe.model';
import { FavoriteRepository } from '../domain/favorite.repository';

@Injectable()
export class FavoriteHttpRepository extends FavoriteRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMyFavorites(): Observable<RecipeSummary[]> {
    return this.http.get<RecipeSummary[]>(`${this.apiUrl}/users/me/favorites`);
  }

  isFavorite(recipeId: number): Observable<boolean> {
    return this.http
      .get<Record<string, boolean>>(`${this.apiUrl}/recipes/${recipeId}/favorite`)
      .pipe(map((res) => Object.values(res)[0] ?? false));
  }

  addFavorite(recipeId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/recipes/${recipeId}/favorite`, null);
  }

  removeFavorite(recipeId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/recipes/${recipeId}/favorite`);
  }
}
