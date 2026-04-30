import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'recetapps';
const DB_VERSION = 2;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS recipes (
    id          INTEGER,
    client_id   TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    description TEXT,
    ingredients TEXT NOT NULL DEFAULT '',
    instructions TEXT NOT NULL DEFAULT '',
    prep_time   INTEGER NOT NULL DEFAULT 0,
    cook_time   INTEGER NOT NULL DEFAULT 0,
    servings    INTEGER NOT NULL DEFAULT 1,
    user_id     INTEGER,
    username    TEXT,
    created_at  TEXT,
    updated_at  TEXT,
    deleted_at  TEXT,
    pending_sync INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS recipe_categories (
    recipe_client_id TEXT NOT NULL,
    category_id      INTEGER NOT NULL,
    PRIMARY KEY (recipe_client_id, category_id)
  );

  CREATE TABLE IF NOT EXISTS recipe_images (
    id               INTEGER PRIMARY KEY,
    recipe_client_id TEXT NOT NULL,
    filename         TEXT,
    url              TEXT,
    created_at       TEXT,
    pending_sync     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id           INTEGER,
    client_id    TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    description  TEXT,
    created_at   TEXT,
    updated_at   TEXT,
    deleted_at   TEXT,
    pending_sync INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS favorites (
    recipe_id    INTEGER NOT NULL PRIMARY KEY,
    updated_at   TEXT,
    deleted_at   TEXT,
    pending_sync INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sync_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`;

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readonly sqlite = new SQLiteConnection(CapacitorSQLite);
  private connection: SQLiteDBConnection | null = null;
  private initPromise: Promise<SQLiteDBConnection> | null = null;

  getDb(): Promise<SQLiteDBConnection> {
    if (!this.initPromise) {
      this.initPromise = this.init();
    }
    return this.initPromise;
  }

  private async init(): Promise<SQLiteDBConnection> {
    await this.sqlite.addUpgradeStatement(DB_NAME, [
      {
        toVersion: 2,
        statements: [
          'ALTER TABLE recipe_images ADD COLUMN pending_sync INTEGER NOT NULL DEFAULT 0;',
        ],
      },
    ]);

    const isConsistent = await this.sqlite.checkConnectionsConsistency();
    const isOpen = (await this.sqlite.isConnection(DB_NAME, false)).result;

    if (isConsistent.result && isOpen) {
      this.connection = await this.sqlite.retrieveConnection(DB_NAME, false);
    } else {
      this.connection = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', DB_VERSION, false);
      await this.connection.open();
      await this.connection.execute(SCHEMA);
    }

    return this.connection;
  }

  async clearUserData(): Promise<void> {
    const db = await this.getDb();

    const statements = [
      { statement: 'DELETE FROM favorites;', values: [] },
      { statement: 'DELETE FROM recipe_images;', values: [] },
      { statement: 'DELETE FROM recipe_categories;', values: [] },
      { statement: 'DELETE FROM recipes;', values: [] },
      { statement: 'DELETE FROM categories;', values: [] },
      { statement: 'DELETE FROM sync_meta;', values: [] }
    ];

    await db.executeSet(statements);
  }

}
