export interface RecipeRow {
  rowid?: number;
  id?: number;
  client_id: string;
  title: string;
  description?: string | null;
  ingredients: string;
  instructions: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  user_id?: number | null;
  username?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  pending_sync?: number | boolean;
}

export interface RecipeAggregatedRow extends RecipeRow {
  category_ids?: string | null;
  first_image_url?: string | null;
}

export interface RecipeCategoryRow {
  category_id: number;
}

export interface RecipeImageRow {
  id: number;
  filename: string;
  url: string;
  created_at: string;
}

export interface QueryResult<T> {
  values?: T[];
}

export interface PendingImageRow {
  id: number;
  recipe_client_id: string;
  filename: string | null;
  url: string;
  server_recipe_id: number;
}
