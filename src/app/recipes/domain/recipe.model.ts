export interface RecipeImage {
  id: number;
  filename: string;
  url: string;
  createdAt?: string;
}

interface RecipeBase {
  title: string;
  prepTime: number;
  cookTime: number;
  servings: number;
}

export interface RecipeSummary extends RecipeBase {
  id: number;
  firstImageUrl: string | null;
}

export interface Recipe extends RecipeBase {
  id?: number;
  description?: string;
  ingredients: string;
  instructions: string;
  categoryId?: number;
  categoryName?: string;
  userId?: number;
  username?: string;
  images?: RecipeImage[];
  createdAt?: string;
  updatedAt?: string;
}
