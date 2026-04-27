import { inject, Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { DatabaseService } from '../../shared/infrastructure/database.service';
import { RecipeRepository } from '../domain/recipe.repository';
import { Recipe, RecipeImage, RecipeSummary } from '../domain/recipe.model';
import {
  RecipeRow,
  RecipeAggregatedRow,
  RecipeCategoryRow,
  RecipeImageRow,
  QueryResult,
} from './recipe-sqlite.types';

// ───────────────────────────────────────────────────────────────────────────────

@Injectable()
export class RecipeSqliteRepository extends RecipeRepository {
  private readonly db = inject(DatabaseService);

  getAll(): Observable<RecipeSummary[]> {
    return this.query(async (db) => {
      const result = (await db.query(
        `SELECT r.rowid, r.*,
                GROUP_CONCAT(rc.category_id) as category_ids,
                (SELECT url FROM recipe_images
                 WHERE recipe_client_id = r.client_id
                 ORDER BY id DESC LIMIT 1) as first_image_url
         FROM recipes r
         LEFT JOIN recipe_categories rc ON rc.recipe_client_id = r.client_id
         WHERE r.deleted_at IS NULL
         GROUP BY r.client_id
         ORDER BY r.updated_at DESC`,
      )) as QueryResult<RecipeAggregatedRow>;

      return (result.values ?? []).map(this.rowToSummary);
    });
  }

  getById(id: number): Observable<Recipe> {
    return this.query(async (db) => {
      const [recipeRow, categoriesResult, imagesResult] = await Promise.all([
        db.query(
          `SELECT rowid, * FROM recipes WHERE ${this.idCondition(id)}`,
          this.idParams(id),
        ) as Promise<QueryResult<RecipeRow>>,

        db.query(
          `SELECT rc.category_id FROM recipe_categories rc
           JOIN recipes r ON r.client_id = rc.recipe_client_id
           WHERE ${this.idCondition(id, 'r')}`,
          this.idParams(id),
        ) as Promise<QueryResult<RecipeCategoryRow>>,

        db.query(
          `SELECT ri.* FROM recipe_images ri
           JOIN recipes r ON r.client_id = ri.recipe_client_id
           WHERE ${this.idCondition(id, 'r')}`,
          this.idParams(id),
        ) as Promise<QueryResult<RecipeImageRow>>,
      ]);

      const row = recipeRow.values?.[0];
      if (!row) throw new Error(`Recipe not found: ${id}`);

      return this.rowToRecipe(
        row,
        (categoriesResult.values ?? []).map((r) => r.category_id),
        (imagesResult.values ?? []).map(this.rowToImage),
      );
    });
  }

  create(recipe: Recipe): Observable<Recipe> {
    return this.query(async (db) => {
      const clientId = crypto.randomUUID();
      const now = new Date().toISOString();

      const result = await db.run(
        `INSERT INTO recipes
           (id, client_id, title, description, ingredients, instructions,
            prep_time, cook_time, servings, user_id, username, created_at, updated_at, pending_sync)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          null,
          clientId,
          recipe.title,
          recipe.description ?? null,
          recipe.ingredients,
          recipe.instructions,
          recipe.prepTime,
          recipe.cookTime,
          recipe.servings,
          recipe.userId ?? null,
          recipe.username ?? null,
          now,
          now,
        ],
        true,
      );

      const tempId = -(result.changes?.lastId ?? Date.now());

      if (recipe.categoryIds?.length) {
        await this.replaceCategories(db, clientId, recipe.categoryIds);
      }

      return {
        ...recipe,
        id: tempId,
        clientId,
        createdAt: now,
        updatedAt: now,
        pendingSync: true,
      };
    });
  }

  update(id: number, recipe: Recipe): Observable<Recipe> {
    return this.query(async (db) => {
      const now = new Date().toISOString();

      await db.run(
        `UPDATE recipes
         SET title = ?, description = ?, ingredients = ?, instructions = ?,
             prep_time = ?, cook_time = ?, servings = ?, updated_at = ?, pending_sync = 1
         WHERE ${this.idCondition(id)}`,
        [
          recipe.title,
          recipe.description ?? null,
          recipe.ingredients,
          recipe.instructions,
          recipe.prepTime,
          recipe.cookTime,
          recipe.servings,
          now,
          ...this.idParams(id),
        ],
        true,
      );

      const clientId = await this.getClientId(db, id);

      if (recipe.categoryIds) {
        await this.replaceCategories(db, clientId, recipe.categoryIds);
      }

      return { ...recipe, id, updatedAt: now, pendingSync: true };
    });
  }

  delete(id: number): Observable<void> {
    return this.query(async (db) => {
      const now = new Date().toISOString();

      await db.run(
        `UPDATE recipes
         SET deleted_at = ?, updated_at = ?, pending_sync = 1
         WHERE ${this.idCondition(id)}`,
        [now, now, ...this.idParams(id)],
        true,
      );
    });
  }

  getByUser(userId: number): Observable<Recipe[]> {
    return this.query(async (db) => {
      const result = (await db.query(
        `SELECT r.rowid, r.*, GROUP_CONCAT(rc.category_id) as category_ids
         FROM recipes r
         LEFT JOIN recipe_categories rc ON rc.recipe_client_id = r.client_id
         WHERE r.user_id = ? AND r.deleted_at IS NULL
         GROUP BY r.client_id
         ORDER BY r.updated_at DESC`,
        [userId],
      )) as QueryResult<RecipeAggregatedRow>;

      return (result.values ?? []).map((row) =>
        this.rowToRecipe(row, this.parseCategoryIds(row)),
      );
    });
  }

  search(keyword: string): Observable<Recipe[]> {
    return this.query(async (db) => {
      const like = `%${keyword}%`;

      const result = (await db.query(
        `SELECT r.rowid, r.*, GROUP_CONCAT(rc.category_id) as category_ids
         FROM recipes r
         LEFT JOIN recipe_categories rc ON rc.recipe_client_id = r.client_id
         WHERE r.deleted_at IS NULL AND (r.title LIKE ? OR r.ingredients LIKE ?)
         GROUP BY r.client_id
         ORDER BY r.updated_at DESC`,
        [like, like],
      )) as QueryResult<RecipeAggregatedRow>;

      return (result.values ?? []).map((row) =>
        this.rowToRecipe(row, this.parseCategoryIds(row)),
      );
    });
  }

  getByCategory(categoryId: number): Observable<Recipe[]> {
    return this.query(async (db) => {
      const result = (await db.query(
        `SELECT r.rowid, r.*, GROUP_CONCAT(rc2.category_id) as category_ids
         FROM recipes r
         JOIN recipe_categories rc ON rc.recipe_client_id = r.client_id AND rc.category_id = ?
         LEFT JOIN recipe_categories rc2 ON rc2.recipe_client_id = r.client_id
         WHERE r.deleted_at IS NULL
         GROUP BY r.client_id
         ORDER BY r.updated_at DESC`,
        [categoryId],
      )) as QueryResult<RecipeAggregatedRow>;

      return (result.values ?? []).map((row) =>
        this.rowToRecipe(row, this.parseCategoryIds(row)),
      );
    });
  }

  getFavorites(): Observable<Recipe[]> {
    return this.query(async (db) => {
      const result = await db.query(
        `SELECT r.rowid, r.*, GROUP_CONCAT(rc.category_id) as category_ids
         FROM recipes r
         JOIN favorites f ON f.recipe_client_id = r.client_id
         LEFT JOIN recipe_categories rc ON rc.recipe_client_id = r.client_id
         WHERE r.deleted_at IS NULL AND f.user_id = ?
         GROUP BY r.client_id
         ORDER BY r.updated_at DESC`,
        [/* current user ID should be passed here */],
      );

      return (result.values ?? []).map((row) =>
        this.rowToRecipe(row, this.parseCategoryIds(row)),
      );

    });
  }

  updateCategories(recipeId: number, categoryIds: number[]): Observable<Recipe> {
    return this.query(async (db) => {
      const now = new Date().toISOString();
      const clientId = await this.getClientId(db, recipeId);

      await this.replaceCategories(db, clientId, categoryIds);

      await db.run(
        `UPDATE recipes SET updated_at = ?, pending_sync = 1
         WHERE ${this.idCondition(recipeId)}`,
        [now, ...this.idParams(recipeId)],
        true,
      );

      return this.getById(recipeId).toPromise() as Promise<Recipe>;
    });
  }

  uploadImage(recipeId: number, file: File): Observable<RecipeImage> {
    return this.query(async (db) => {
      const clientId = await this.getClientId(db, recipeId);
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const tempId = -Date.now();
      const localPath = `recipe_images/${clientId}_pending_${-tempId}.${ext}`;

      const base64 = await this.fileToBase64(file);

      await Filesystem.writeFile({
        path: localPath,
        data: base64,
        directory: Directory.Data,
        recursive: true,
      });

      const { uri } = await Filesystem.getUri({
        path: localPath,
        directory: Directory.Data,
      });

      const localUrl = Capacitor.convertFileSrc(uri);

      await db.run(
        `INSERT INTO recipe_images
         (id, recipe_client_id, filename, url, created_at, pending_sync)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [tempId, clientId, file.name, localUrl, new Date().toISOString()],
        true,
      );

      return {
        id: tempId,
        filename: file.name,
        url: localUrl,
        createdAt: new Date().toISOString(),
      };
    });
  }

  // ────────────────────────────────────────────────────────────────────────────

  private query<T>(fn: (db: SQLiteDBConnection) => Promise<T>): Observable<T> {
    return from(this.db.getDb()).pipe(switchMap((db) => from(fn(db))));
  }

  private idCondition(id: number, alias = ''): string {
    const prefix = alias ? `${alias}.` : '';
    return id >= 0 ? `${prefix}id = ?` : `${prefix}rowid = ?`;
  }

  private idParams(id: number): number[] {
    return [id >= 0 ? id : -id];
  }

  private async getClientId(db: SQLiteDBConnection, id: number): Promise<string> {
    const result = (await db.query(
      `SELECT client_id FROM recipes WHERE ${this.idCondition(id)}`,
      this.idParams(id),
    )) as QueryResult<{ client_id: string }>;

    const row = result.values?.[0];
    if (!row) throw new Error(`Recipe not found: ${id}`);

    return row.client_id;
  }

  private async replaceCategories(
    db: SQLiteDBConnection,
    clientId: string,
    categoryIds: number[],
  ): Promise<void> {
    await db.run(`DELETE FROM recipe_categories WHERE recipe_client_id = ?`, [clientId], true);

    for (const catId of categoryIds) {
      await db.run(
        `INSERT OR IGNORE INTO recipe_categories (recipe_client_id, category_id)
         VALUES (?, ?)`,
        [clientId, catId],
        true,
      );
    }
  }

  private parseCategoryIds(row: { category_ids?: string | null }): number[] {
    return row.category_ids
      ? row.category_ids
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : [];
  }

  private rowToSummary = (row: RecipeAggregatedRow): RecipeSummary => ({
    id: row.id ?? -row.rowid!,
    title: row.title,
    firstImageUrl: row.first_image_url ?? null,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    categoryIds: this.parseCategoryIds(row),
  });

  private rowToRecipe(
    row: RecipeRow,
    categoryIds: number[] = [],
    images: RecipeImage[] = [],
  ): Recipe {
    return {
      id: row.id ?? -row.rowid!,
      clientId: row.client_id,
      title: row.title,
      description: row.description ?? undefined,
      ingredients: row.ingredients,
      instructions: row.instructions,
      prepTime: row.prep_time,
      cookTime: row.cook_time,
      servings: row.servings,
      userId: row.user_id ?? undefined,
      username: row.username ?? undefined,
      categoryIds,
      images,
      createdAt: row.created_at ?? undefined,
      updatedAt: row.updated_at ?? undefined,
      deletedAt: row.deleted_at ?? undefined,
      pendingSync: !!row.pending_sync,
    };
  }

  private rowToImage = (row: RecipeImageRow): RecipeImage => ({
    id: row.id,
    filename: row.filename,
    url: row.url,
    createdAt: row.created_at,
  });

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
