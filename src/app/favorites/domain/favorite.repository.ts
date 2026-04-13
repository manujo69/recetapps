import { Observable } from 'rxjs';
import { RecipeSummary } from '../../recipes/domain/recipe.model';

export abstract class FavoriteRepository {
  abstract getMyFavorites(): Observable<RecipeSummary[]>;
  abstract isFavorite(recipeId: number): Observable<boolean>;
  abstract addFavorite(recipeId: number): Observable<void>;
  abstract removeFavorite(recipeId: number): Observable<void>;
}
