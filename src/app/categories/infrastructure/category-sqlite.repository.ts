import { inject, Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DatabaseService } from '../../shared/infrastructure/database.service';
import { CategoryRepository } from '../domain/category.repository';
import { Category } from '../domain/category.model';

interface CategoryRow  {
  id?: number,
  client_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  pending_sync?: number | boolean;
  rowid?: number;
};


@Injectable()
export class CategorySqliteRepository extends CategoryRepository {
  private readonly db = inject(DatabaseService);

  getAll(): Observable<Category[]> {
    return this.query(async (db) => {
      const result = await db.query(
        `SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY name ASC`,
      );
      return (result.values ?? []).map(this.rowToCategory);
    });
  }

  getById(id: number): Observable<Category> {
    return this.query(async (db) => {
      const result = await db.query(`SELECT * FROM categories WHERE id = ?`, [id]);
      const row = result.values?.[0];
      if (!row) throw new Error(`Category not found: ${id}`);
      return this.rowToCategory(row);
    });
  }

  create(category: Category): Observable<Category> {
    return this.query(async (db) => {
      const clientId = crypto.randomUUID();
      const now = new Date().toISOString();

      await db.run(
        `INSERT INTO categories (id, client_id, name, description, created_at, updated_at, pending_sync)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [null, clientId, category.name, category.description ?? null, now, now],
        true,
      );

      const result = await db.query(
        `SELECT rowid, * FROM categories WHERE client_id = ?`,
        [clientId],
      );
      const row = result.values?.[0];
      return this.rowToCategory({ ...row, id: -row['rowid'] });
    });
  }

  update(id: number, category: Category): Observable<Category> {
    return this.query(async (db) => {
      const now = new Date().toISOString();
      await db.run(
        `UPDATE categories SET name = ?, description = ?, updated_at = ?, pending_sync = 1 WHERE id = ?`,
        [category.name, category.description ?? null, now, id],
        true,
      );
      return { ...category, id, updatedAt: now, pendingSync: true };
    });
  }

  delete(id: number): Observable<void> {
    return this.query(async (db) => {
      const now = new Date().toISOString();
      await db.run(
        `UPDATE categories SET deleted_at = ?, updated_at = ?, pending_sync = 1 WHERE id = ?`,
        [now, now, id],
        true,
      );
    });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private query<T>(fn: (db: SQLiteDBConnection) => Promise<T>): Observable<T> {
    return from(this.db.getDb()).pipe(switchMap((db) => from(fn(db))));
  }

  private rowToCategory = (row: CategoryRow): Category => ({
    id: row['id'] ?? undefined,
    clientId: row['client_id'],
    name: row['name'],
    description: row['description'] ?? undefined,
    createdAt: row['created_at'] ?? undefined,
    updatedAt: row['updated_at'] ?? undefined,
    deletedAt: row['deleted_at'] ?? undefined,
    pendingSync: !!row['pending_sync'],
  });
}
