import { Observable } from 'rxjs';
import { Recipe, RecipeImage, RecipeSummary } from './recipe.model';

export abstract class RecipeRepository {
  abstract getAll(): Observable<RecipeSummary[]>;
  abstract getById(id: number): Observable<Recipe>;
  abstract create(recipe: Recipe): Observable<Recipe>;
  abstract update(id: number, recipe: Recipe): Observable<Recipe>;
  abstract delete(id: number): Observable<void>;
  abstract getByUser(userId: number): Observable<Recipe[]>;
  abstract search(keyword: string): Observable<Recipe[]>;
  abstract getByCategory(categoryId: number): Observable<Recipe[]>;
  abstract uploadImage(recipeId: number, file: File): Observable<RecipeImage>;
}
