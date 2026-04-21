import { Recipe } from '../../recipes/domain/recipe.model';

type RecipeSyncOmitted = 'pendingSync' | 'categoryNames';
type RecipePushOmitted = RecipeSyncOmitted | 'username' | 'userId' | 'images' | 'createdAt';

export type RecipeSync = Omit<Recipe, RecipeSyncOmitted>;

export type RecipePushItem = Omit<Recipe, RecipePushOmitted>;

export interface CategorySync {
  id?: number | null;
  clientId?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface FavoriteSync {
  recipeId: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SyncResponse {
  recipes: RecipeSync[];
  categories: CategorySync[];
  favorites: FavoriteSync[];
  serverTime: string;
}

export interface CategoryPushItem {
  clientId?: string;
  id?: number | null;
  name: string;
  description?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface FavoritePushItem {
  recipeId: number;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface IdMapping {
  clientId: string;
  serverId: number;
}

export interface SyncPushResponse {
  recipes: IdMapping[];
  categories: IdMapping[];
}
