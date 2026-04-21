import { inject, Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DatabaseService } from '../../shared/infrastructure/database.service';
import { FavoriteRepository } from '../domain/favorite.repository';
import { RecipeSummary } from '../../recipes/domain/recipe.model';

export interface FavoriteRow
{
  id: number;
  title: string;
  first_image_url?: string;
  prep_time: number;
  cook_time: number,
  servings: number
  category_ids?: string;
}
@Injectable()
export class FavoriteSqliteRepository extends FavoriteRepository {
  private readonly db = inject(DatabaseService);

  getMyFavorites(): Observable<RecipeSummary[]> {
    return this.query(async (db) => {
      const result = await db.query(
        `SELECT r.rowid, r.*,
                GROUP_CONCAT(rc.category_id) as category_ids,
                (SELECT url FROM recipe_images
                 WHERE recipe_client_id = r.client_id
                 ORDER BY id ASC LIMIT 1) as first_image_url
         FROM favorites f
         JOIN recipes r ON r.id = f.recipe_id
         LEFT JOIN recipe_categories rc ON rc.recipe_client_id = r.client_id
         WHERE f.deleted_at IS NULL AND r.deleted_at IS NULL
         GROUP BY r.client_id
         ORDER BY r.title ASC`,
      );
      return (result.values ?? []).map(this.rowToSummary);
    });
  }

  isFavorite(recipeId: number): Observable<boolean> {
    return this.query(async (db) => {
      const result = await db.query(
        `SELECT 1 FROM favorites WHERE recipe_id = ? AND deleted_at IS NULL`,
        [recipeId],
      );
      return (result.values?.length ?? 0) > 0;
    });
  }

  addFavorite(recipeId: number): Observable<void> {
    return this.query(async (db) => {
      const now = new Date().toISOString();
      await db.run(
        `INSERT INTO favorites (recipe_id, updated_at, deleted_at, pending_sync)
         VALUES (?, ?, NULL, 1)
         ON CONFLICT(recipe_id) DO UPDATE SET deleted_at = NULL, updated_at = ?, pending_sync = 1`,
        [recipeId, now, now],
        true,
      );
    });
  }

  removeFavorite(recipeId: number): Observable<void> {
    return this.query(async (db) => {
      const now = new Date().toISOString();
      await db.run(
        `UPDATE favorites SET deleted_at = ?, updated_at = ?, pending_sync = 1 WHERE recipe_id = ?`,
        [now, now, recipeId],
        true,
      );
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private query<T>(fn: (db: SQLiteDBConnection) => Promise<T>): Observable<T> {
    return from(this.db.getDb()).pipe(switchMap((db) => from(fn(db))));
  }

  private parseCategoryIds(row: { category_ids?: string }): number[] {
    return row['category_ids']
      ? String(row['category_ids'])
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : [];
  }

  private rowToSummary = (row: FavoriteRow): RecipeSummary => ({
    id: row['id'],
    title: row['title'],
    firstImageUrl: row['first_image_url'] ?? null,
    prepTime: row['prep_time'],
    cookTime: row['cook_time'],
    servings: row['servings'],
    categoryIds: this.parseCategoryIds(row),
  });
}
