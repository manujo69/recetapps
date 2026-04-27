export function latestImage(images: RecipeImage[] | undefined): RecipeImage | undefined {
  if (!images || images.length === 0) return undefined;
  return images.reduce((best, img) => (img.id > best.id ? img : best));
}

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
  id?: number | null;
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
  deletedAt?: string | null;
  pendingSync?: boolean;
}
