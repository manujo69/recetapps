import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Recipe, RecipeImage, RecipeSummary } from '../domain/recipe.model';
import { RecipeRepository } from '../domain/recipe.repository';

@Injectable()
export class RecipeHttpRepository extends RecipeRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recipes`;
  private readonly baseUrl = environment.apiUrl;

  getAll(): Observable<RecipeSummary[]> {
    return this.http.get<RecipeSummary[]>(this.apiUrl).pipe(
      map((summaries) =>
        summaries.map((s) => ({
          ...s,
          firstImageUrl: s.firstImageUrl ? this.toAbsoluteUrl(s.firstImageUrl) : null,
        })),
      ),
    );
  }

  getById(id: number): Observable<Recipe> {
    return this.http.get<Recipe>(`${this.apiUrl}/${id}`).pipe(map(this.mapRecipe));
  }

  create(recipe: Recipe): Observable<Recipe> {
    return this.http.post<Recipe>(this.apiUrl, recipe).pipe(map(this.mapRecipe));
  }

  update(id: number, recipe: Recipe): Observable<Recipe> {
    return this.http.put<Recipe>(`${this.apiUrl}/${id}`, recipe).pipe(map(this.mapRecipe));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getByUser(userId: number): Observable<Recipe[]> {
    return this.http
      .get<Recipe[]>(`${this.apiUrl}/user/${userId}`)
      .pipe(map((recipes) => recipes.map(this.mapRecipe)));
  }

  search(keyword: string): Observable<Recipe[]> {
    return this.http
      .get<Recipe[]>(`${this.apiUrl}/search`, { params: { keyword } })
      .pipe(map((recipes) => recipes.map(this.mapRecipe)));
  }

  getByCategory(categoryId: number): Observable<Recipe[]> {
    return this.http
      .get<Recipe[]>(`${this.apiUrl}/category/${categoryId}`)
      .pipe(map((recipes) => recipes.map(this.mapRecipe)));
  }

  uploadImage(recipeId: number, file: File): Observable<RecipeImage> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<RecipeImage>(`${this.apiUrl}/${recipeId}/images`, formData)
      .pipe(map(this.mapImage));
  }

  private readonly mapImage = (image: RecipeImage): RecipeImage => ({
    ...image,
    url: this.toAbsoluteUrl(image.url),
  });

  private readonly mapRecipe = (recipe: Recipe): Recipe => ({
    ...recipe,
    images: recipe.images?.map(this.mapImage),
  });

  private toAbsoluteUrl(url: string): string {
    if (!url || url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
