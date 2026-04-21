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
  categoryIds?: number[];
}

export interface Recipe extends RecipeBase {
  id?: number;
  clientId?: string;
  description?: string;
  ingredients: string;
  instructions: string;
  categoryIds?: number[];
  categoryNames?: string[];
  userId?: number;
  username?: string;
  images?: RecipeImage[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  pendingSync?: boolean;
}
