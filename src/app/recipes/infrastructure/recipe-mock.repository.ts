import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Recipe, RecipeImage, RecipeSummary } from '../domain/recipe.model';
import { RecipeRepository } from '../domain/recipe.repository';

const MOCK_RECIPES: Recipe[] = [
  {
    id: 1,
    title: 'Tortilla española',
    description: 'La clásica tortilla de patatas con cebolla.',
    ingredients: '6 huevos\n500 g patatas\n1 cebolla\n200 ml aceite de oliva\nSal al gusto',
    instructions:
      'Pela y corta las patatas en láminas finas.\nPocha las patatas y la cebolla en aceite a fuego bajo durante 20 minutos.\nBate los huevos con sal y mezcla con las patatas escurridas.\nCuaja la tortilla a fuego medio, dándole la vuelta con un plato.',
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    categoryIds: [1],
    categoryNames: ['Platos principales'],
    userId: 1,
    username: 'admin',
  },
  {
    id: 2,
    title: 'Gazpacho andaluz',
    description: 'Sopa fría de tomate, perfecta para el verano.',
    ingredients:
      '1 kg tomates maduros\n1 pepino\n1 pimiento verde\n1 diente de ajo\n50 ml aceite de oliva virgen extra\n20 ml vinagre de Jerez\nSal al gusto',
    instructions:
      'Lava y trocea todas las verduras.\nTritura todo junto con el aceite, vinagre y sal.\nCuela la mezcla y ajusta de sal y vinagre.\nRefrigera al menos 2 horas antes de servir.',
    prepTime: 15,
    cookTime: 0,
    servings: 6,
    categoryIds: [2],
    categoryNames: ['Sopas y cremas'],
    userId: 1,
    username: 'admin',
  },
];

let nextId = MOCK_RECIPES.length + 1;

@Injectable()
export class RecipeMockRepository extends RecipeRepository {
  private recipes: Recipe[] = [...MOCK_RECIPES];

  getAll(): Observable<RecipeSummary[]> {
    return of(
      this.recipes.map((r) => ({
        id: r.id!,
        title: r.title,
        firstImageUrl: Array.isArray(r.images) && r.images.length > 0 ? r.images[0].url : null,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        categoryIds: r.categoryIds ?? [],
      })),
    );
  }

  getById(id: number): Observable<Recipe> {
    const recipe = this.recipes.find((r) => r.id === id);
    return recipe ? of({ ...recipe }) : throwError(() => new Error(`Recipe ${id} not found`));
  }

  create(recipe: Recipe): Observable<Recipe> {
    const created: Recipe = { ...recipe, id: nextId++ };
    this.recipes.push(created);
    return of({ ...created });
  }

  update(id: number, recipe: Recipe): Observable<Recipe> {
    const index = this.recipes.findIndex((r) => r.id === id);
    if (index === -1) return throwError(() => new Error(`Recipe ${id} not found`));
    this.recipes[index] = { ...recipe, id };
    return of({ ...this.recipes[index] });
  }

  delete(id: number): Observable<void> {
    const index = this.recipes.findIndex((r) => r.id === id);
    if (index === -1) return throwError(() => new Error(`Recipe ${id} not found`));
    this.recipes.splice(index, 1);
    return of(undefined);
  }

  getByUser(userId: number): Observable<Recipe[]> {
    return of(this.recipes.filter((r) => r.userId === userId));
  }

  search(keyword: string): Observable<Recipe[]> {
    const lower = keyword.toLowerCase();
    return of(
      this.recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.description?.toLowerCase().includes(lower) ||
          r.ingredients.toLowerCase().includes(lower),
      ),
    );
  }

  getByCategory(categoryId: number): Observable<Recipe[]> {
    return of(this.recipes.filter((r) => r.categoryIds?.includes(categoryId)));
  }

  getFavorites(): Observable<Recipe[]> {
    // Para el mock, simplemente devolvemos las recetas con ID impar como favoritas
    return of(this.recipes.filter((r) => r.id! % 2 === 1));
  }

  updateCategories(recipeId: number, categoryIds: number[]): Observable<Recipe> {
    const index = this.recipes.findIndex((r) => r.id === recipeId);
    if (index === -1) return throwError(() => new Error(`Recipe ${recipeId} not found`));
    this.recipes[index] = { ...this.recipes[index], categoryIds };
    return of({ ...this.recipes[index] });
  }

  uploadImage(recipeId: number, file: File): Observable<RecipeImage> {
    const index = this.recipes.findIndex((r) => r.id === recipeId);
    if (index === -1) return throwError(() => new Error(`Recipe ${recipeId} not found`));

    const image: RecipeImage = {
      id: Date.now(),
      filename: file.name,
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
    };

    const recipe = this.recipes[index];
    this.recipes[index] = { ...recipe, images: [...(recipe.images ?? []), image] };
    return of({ ...image });
  }
}
