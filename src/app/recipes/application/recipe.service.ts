import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Recipe, RecipeImage, RecipeSummary } from '../domain/recipe.model';
import { RecipeRepository } from '../domain/recipe.repository';

@Injectable()
export class RecipeService {
  private readonly repository = inject(RecipeRepository);

  getAll(): Observable<RecipeSummary[]> {
    return this.repository.getAll();
  }

  getById(id: number): Observable<Recipe> {
    return this.repository.getById(id);
  }

  create(recipe: Recipe): Observable<Recipe> {
    return this.repository.create(recipe);
  }

  update(id: number, recipe: Recipe): Observable<Recipe> {
    return this.repository.update(id, recipe);
  }

  delete(id: number): Observable<void> {
    return this.repository.delete(id);
  }

  getByUser(userId: number): Observable<Recipe[]> {
    return this.repository.getByUser(userId);
  }

  search(keyword: string): Observable<Recipe[]> {
    return this.repository.search(keyword);
  }

  getByCategory(categoryId: number): Observable<Recipe[]> {
    return this.repository.getByCategory(categoryId);
  }

  uploadImage(recipeId: number, file: File): Observable<RecipeImage> {
    return this.repository.uploadImage(recipeId, file);
  }
}
