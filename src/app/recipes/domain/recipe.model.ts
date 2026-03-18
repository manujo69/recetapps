export interface RecipeImage {
  id: number;
  filename: string;
  url: string;
  createdAt?: string;
}

export interface Recipe {
  id?: number;
  title: string;
  description?: string;
  ingredients: string;
  instructions: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  categoryId?: number;
  categoryName?: string;
  userId?: number;
  username?: string;
  images?: RecipeImage[];
  createdAt?: string;
  updatedAt?: string;
}
