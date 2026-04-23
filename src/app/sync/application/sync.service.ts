import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { DatabaseService } from '../../shared/infrastructure/database.service';
import { environment } from '../../../environments/environment';
import { RecipeImage } from '../../recipes/domain/recipe.model';
import { RecipeAggregatedRow, PendingImageRow } from '../../recipes/infrastructure/recipe-sqlite.types';
import { CategoryRow } from '../../categories/infrastructure/category-sqlite.types';
import { FavoriteRow } from '../../favorites/infrastructure/favorite-sqlite.types';
import {
  RecipeSync,
  CategorySync,
  FavoriteSync,
  SyncResponse,
  RecipePushItem,
  CategoryPushItem,
  FavoritePushItem,
  SyncPushResponse,
} from './sync.types';

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class SyncService {
  private readonly http = inject(HttpClient);
  private readonly db = inject(DatabaseService);
  private readonly syncUrl = `${environment.apiUrl}/sync`;

  /**
   * Called after login/register: full pull from server then push local pending.
   */
  async syncOnLogin(): Promise<void> {
    await this.pull();
    await this.push();
  }

  /**
   * Incremental pull: fetches only records changed since last sync.
   * Pass no argument for a full pull.
   */
  async pull(since?: string): Promise<void> {
    const url = since ? `${this.syncUrl}?since=${encodeURIComponent(since)}` : this.syncUrl;
    const response = await firstValueFrom(this.http.get<SyncResponse>(url));

    const db = await this.db.getDb();
    await db.beginTransaction();
    try {
      await this.upsertCategories(db, response.categories);
      await this.upsertRecipes(db, response.recipes);
      await this.upsertFavorites(db, response.favorites, !since);
      await this.saveLastSyncAt(db, response.serverTime);
      await db.commitTransaction();
    } catch (err) {
      await db.rollbackTransaction();
      throw err;
    }
  }

  /**
   * Pushes all locally pending records to the server, then updates local IDs.
   */
  async push(): Promise<void> {
    const db = await this.db.getDb();

    const [pendingRecipes, pendingCategories, pendingFavorites] = await Promise.all([
      db.query(`SELECT r.*, GROUP_CONCAT(rc.category_id) AS category_ids
                FROM recipes r
                LEFT JOIN recipe_categories rc ON rc.recipe_client_id = r.client_id
                WHERE r.pending_sync = 1
                GROUP BY r.client_id`),
      db.query(`SELECT * FROM categories WHERE pending_sync = 1`),
      db.query(`SELECT * FROM favorites WHERE pending_sync = 1`),
    ]);

    const recipes: RecipePushItem[] = (pendingRecipes.values as RecipeAggregatedRow[] ?? []).map(this.toRecipePushItem);
    const categories: CategoryPushItem[] = (pendingCategories.values as CategoryRow[] ?? []).map(this.toCategoryPushItem);
    const favorites: FavoritePushItem[] = (pendingFavorites.values as FavoriteRow[] ?? []).map(this.toFavoritePushItem);

    if (!recipes.length && !categories.length && !favorites.length) return;

    const response = await firstValueFrom(
      this.http.post<SyncPushResponse>(this.syncUrl, { recipes, categories, favorites }),
    );

    await db.beginTransaction();
    try {
      await this.applyIdMappings(db, response);
      await db.commitTransaction();
    } catch (err) {
      await db.rollbackTransaction();
      throw err;
    }

    await this.pushPendingImages(db);
  }

  /** Returns the last_sync_at value stored in sync_meta, or undefined. */
  async getLastSyncAt(): Promise<string | undefined> {
    const db = await this.db.getDb();
    const result = await db.query(`SELECT value FROM sync_meta WHERE key = 'last_sync_at'`);
    return (result.values?.[0] as { value: string } | undefined)?.value ?? undefined;
  }

  // ── Pull helpers ─────────────────────────────────────────────────────────────

  /** Normalizes any ISO-8601 string to UTC ("Z") format so SQLite text comparisons are consistent. */
  private toUtc(ts: string | null | undefined): string | null {
    if (!ts) return null;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  private async upsertRecipes(db: SQLiteDBConnection, recipes: RecipeSync[]): Promise<void> {
    for (const r of recipes) {
      // Prefer the clientId from the server response. If absent, look up the
      // existing local row by server id so we don't create a duplicate entry.
      let clientId = r.clientId;
      if (!clientId) {
        const existing = await db.query(
          `SELECT client_id FROM recipes WHERE id = ?`,
          [r.id],
        );
        clientId = (existing.values?.[0] as { client_id: string } | undefined)?.client_id
          ?? String(r.id);
      }

      await db.run(
        `INSERT INTO recipes
           (id, client_id, title, description, ingredients, instructions,
            prep_time, cook_time, servings, user_id, username,
            created_at, updated_at, deleted_at, pending_sync)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(client_id) DO UPDATE SET
           id          = excluded.id,
           title       = excluded.title,
           description = excluded.description,
           ingredients = excluded.ingredients,
           instructions = excluded.instructions,
           prep_time   = excluded.prep_time,
           cook_time   = excluded.cook_time,
           servings    = excluded.servings,
           user_id     = excluded.user_id,
           username    = excluded.username,
           updated_at  = excluded.updated_at,
           deleted_at  = excluded.deleted_at,
           pending_sync = 0
         WHERE excluded.updated_at >= recipes.updated_at`,
        [
          r.id ?? null,
          clientId,
          r.title,
          r.description ?? null,
          r.ingredients,
          r.instructions,
          r.prepTime,
          r.cookTime,
          r.servings,
          r.userId ?? null,
          r.username ?? null,
          this.toUtc(r.createdAt),
          this.toUtc(r.updatedAt),
          this.toUtc(r.deletedAt),
        ],
        false,
      );

      if (r.categoryIds?.length) {
        await db.run(`DELETE FROM recipe_categories WHERE recipe_client_id = ?`, [clientId], false);
        for (const catId of r.categoryIds) {
          await db.run(
            `INSERT OR IGNORE INTO recipe_categories (recipe_client_id, category_id) VALUES (?, ?)`,
            [clientId, catId],
            false,
          );
        }
      }

      if (r.images?.length) {
        await db.run(`DELETE FROM recipe_images WHERE recipe_client_id = ?`, [clientId], false);
        for (const img of r.images) {
          const remoteUrl = img.url?.startsWith('http') ? img.url : `${environment.apiUrl}${img.url}`;
          let storedUrl = remoteUrl;
          try {
            storedUrl = await this.cacheImage(remoteUrl, clientId, img.id, img.filename);
          } catch {
            // Si falla la descarga, guardamos la URL remota como fallback
          }
          await db.run(
            `INSERT OR REPLACE INTO recipe_images (id, recipe_client_id, filename, url, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [img.id, clientId, img.filename ?? null, storedUrl, img.createdAt ?? null],
            false,
          );
        }
      }
    }
  }

  private async upsertCategories(db: SQLiteDBConnection, categories: CategorySync[]): Promise<void> {
    for (const c of categories) {
      let clientId = c.clientId;
      if (!clientId) {
        const existing = await db.query(
          `SELECT client_id FROM categories WHERE id = ?`,
          [c.id],
        );
        clientId = (existing.values?.[0] as { client_id: string } | undefined)?.client_id
          ?? String(c.id);
      }

      await db.run(
        `INSERT INTO categories
           (id, client_id, name, description, created_at, updated_at, deleted_at, pending_sync)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(client_id) DO UPDATE SET
           id          = excluded.id,
           name        = excluded.name,
           description = excluded.description,
           updated_at  = excluded.updated_at,
           deleted_at  = excluded.deleted_at,
           pending_sync = 0
         WHERE excluded.updated_at >= categories.updated_at`,
        [
          c.id ?? null,
          clientId,
          c.name,
          c.description ?? null,
          this.toUtc(c.createdAt),
          this.toUtc(c.updatedAt),
          this.toUtc(c.deletedAt),
        ],
        false,
      );
    }
  }

  private async upsertFavorites(db: SQLiteDBConnection, favorites: FavoriteSync[], isFullPull: boolean): Promise<void> {
    if (isFullPull) {
      await db.run(`DELETE FROM favorites WHERE pending_sync = 0`, [], false);
      for (const f of favorites) {
        await db.run(
          `INSERT INTO favorites (recipe_id, updated_at, deleted_at, pending_sync)
           VALUES (?, ?, ?, 0)
           ON CONFLICT(recipe_id) DO UPDATE SET
             updated_at  = excluded.updated_at,
             deleted_at  = excluded.deleted_at,
             pending_sync = 0
           WHERE excluded.updated_at >= favorites.updated_at`,
          [f.recipeId, this.toUtc(f.updatedAt), this.toUtc(f.deletedAt)],
          false,
        );
      }
      return;
    }
    for (const f of favorites) {
      await db.run(
        `INSERT INTO favorites (recipe_id, updated_at, deleted_at, pending_sync)
         VALUES (?, ?, ?, 0)
         ON CONFLICT(recipe_id) DO UPDATE SET
           updated_at  = excluded.updated_at,
           deleted_at  = excluded.deleted_at,
           pending_sync = 0
         WHERE excluded.updated_at >= favorites.updated_at`,
        [f.recipeId, this.toUtc(f.updatedAt), this.toUtc(f.deletedAt)],
        false,
      );
    }
  }

  private async saveLastSyncAt(db: SQLiteDBConnection, serverTime: string): Promise<void> {
    await db.run(
      `INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_sync_at', ?)`,
      [serverTime],
      false,
    );
  }

  // ── Push helpers ─────────────────────────────────────────────────────────────

  private toRecipePushItem = (row: RecipeAggregatedRow): RecipePushItem => ({
    clientId: row.client_id,
    id: row.id ?? null,
    title: row.title,
    description: row.description ?? undefined,
    ingredients: row.ingredients,
    instructions: row.instructions,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servings: row.servings,
    categoryIds: row.category_ids
      ? String(row.category_ids).split(',').map(Number).filter((n) => !isNaN(n))
      : [],
    updatedAt: row.updated_at ?? undefined,
    deletedAt: row.deleted_at ?? null,
  });

  private toCategoryPushItem = (row: CategoryRow): CategoryPushItem => ({
    clientId: row.client_id,
    id: row.id ?? null,
    name: row.name,
    description: row.description ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    deletedAt: row.deleted_at ?? null,
  });

  private toFavoritePushItem = (row: FavoriteRow): FavoritePushItem => ({
    recipeId: row.recipe_id,
    updatedAt: row.updated_at ?? undefined,
    deletedAt: row.deleted_at ?? null,
  });

  private async applyIdMappings(db: SQLiteDBConnection, response: SyncPushResponse): Promise<void> {
    for (const { clientId, serverId } of response.recipeMappings ?? []) {
      await db.run(
        `UPDATE recipes SET id = ?, pending_sync = 0 WHERE client_id = ?`,
        [serverId, clientId],
        false,
      );
    }

    for (const { clientId, serverId } of response.categoryMappings ?? []) {
      await db.run(
        `UPDATE categories SET id = ?, pending_sync = 0 WHERE client_id = ?`,
        [serverId, clientId],
        false,
      );
    }

    // Mark all remaining pending records as synced (updates and soft-deletes)
    await db.run(`UPDATE recipes SET pending_sync = 0 WHERE pending_sync = 1`, [], false);
    await db.run(`UPDATE categories SET pending_sync = 0 WHERE pending_sync = 1`, [], false);
    await db.run(`UPDATE favorites SET pending_sync = 0 WHERE pending_sync = 1`, [], false);
  }

  // ── Push pending images ───────────────────────────────────────────────────────

  private async pushPendingImages(db: SQLiteDBConnection): Promise<void> {
    const result = await db.query(
      `SELECT ri.id, ri.recipe_client_id, ri.filename, ri.url,
              r.id AS server_recipe_id
       FROM recipe_images ri
       JOIN recipes r ON r.client_id = ri.recipe_client_id
       WHERE ri.pending_sync = 1 AND r.id IS NOT NULL`,
    );

    for (const row of (result.values ?? []) as PendingImageRow[]) {
      try {
        const ext = (row.filename ?? 'img').split('.').pop()?.toLowerCase() ?? 'jpg';
        const localPath = `recipe_images/${row.recipe_client_id}_pending_${-row.id}.${ext}`;

        let fileData: string;
        try {
          const fileResult = await Filesystem.readFile({ path: localPath, directory: Directory.Data });
          fileData = fileResult.data as string;
        } catch {
          const fallback = await fetch(row.url);
          if (!fallback.ok) throw new Error(`HTTP ${fallback.status}`);
          fileData = this.arrayBufferToBase64(await fallback.arrayBuffer());
        }

        const byteCharacters = atob(fileData);
        const bytes = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          bytes[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: `image/${ext}` });
        const formData = new FormData();
        formData.append('image', blob, row.filename ?? `image.${ext}`);

        const imageResponse = await firstValueFrom(
          this.http.post<RecipeImage>(
            `${environment.apiUrl}/recipes/${row.server_recipe_id}/images`,
            formData,
          ),
        );

        const remoteUrl = imageResponse.url?.startsWith('http')
          ? imageResponse.url
          : `${environment.apiUrl}${imageResponse.url}`;
        let cachedUrl = remoteUrl;
        try {
          cachedUrl = await this.cacheImage(
            remoteUrl,
            row.recipe_client_id,
            imageResponse.id,
            imageResponse.filename,
          );
        } catch {
          // keep remote URL as fallback
        }

        await db.run(
          `UPDATE recipe_images SET id = ?, url = ?, filename = ?, pending_sync = 0 WHERE id = ?`,
          [imageResponse.id, cachedUrl, imageResponse.filename ?? row.filename, row.id],
          true,
        );
      } catch {
        // Skip failed uploads — will retry on next sync
      }
    }
  }

  // ── Image caching ─────────────────────────────────────────────────────────────

  /**
   * Downloads a remote image and saves it to the device filesystem.
   * Returns a WebView-compatible local URL (via Capacitor.convertFileSrc).
   * If the file is already cached, skips the download.
   */
  private async cacheImage(
    remoteUrl: string,
    clientId: string,
    imageId: number,
    filename?: string,
  ): Promise<string> {
    const ext =
      (filename ?? remoteUrl.split('/').pop() ?? 'img')
        .split('.')
        .pop()
        ?.split('?')[0] ?? 'jpg';
    const localPath = `recipe_images/${clientId}_${imageId}.${ext}`;

    // Si ya está cacheada, devolver la URL local directamente
    try {
      await Filesystem.stat({ path: localPath, directory: Directory.Data });
      const { uri } = await Filesystem.getUri({ path: localPath, directory: Directory.Data });
      return Capacitor.convertFileSrc(uri);
    } catch {
      // No existe aún, hay que descargarla
    }

    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const base64 = this.arrayBufferToBase64(await response.arrayBuffer());
    await Filesystem.writeFile({ path: localPath, data: base64, directory: Directory.Data, recursive: true });

    const { uri } = await Filesystem.getUri({ path: localPath, directory: Directory.Data });
    return Capacitor.convertFileSrc(uri);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    for (const byte of new Uint8Array(buffer)) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
}
