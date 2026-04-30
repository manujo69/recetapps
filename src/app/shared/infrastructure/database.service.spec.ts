import { TestBed } from '@angular/core/testing';
import { DatabaseService } from './database.service';
import {
  SQLiteConnection,
  SQLiteDBConnection
} from '@capacitor-community/sqlite';

describe('DatabaseService', () => {
  let service: DatabaseService;

  let sqliteMock: jasmine.SpyObj<SQLiteConnection>;
  let mockDB: jasmine.SpyObj<SQLiteDBConnection>;

  beforeEach(() => {
    // Mock de SQLiteDBConnection
    mockDB = jasmine.createSpyObj<SQLiteDBConnection>('SQLiteDBConnection', [
      'open',
      'execute'
    ]);

    mockDB.open.and.resolveTo(undefined);
    mockDB.execute.and.resolveTo({ changes: { changes: 1 } });

    // Mock de SQLiteConnection
    sqliteMock = jasmine.createSpyObj<SQLiteConnection>('SQLiteConnection', [
      'addUpgradeStatement',
      'checkConnectionsConsistency',
      'isConnection',
      'retrieveConnection',
      'createConnection'
    ]);

    sqliteMock.addUpgradeStatement.and.resolveTo(undefined);
    sqliteMock.checkConnectionsConsistency.and.resolveTo({ result: false });
    sqliteMock.isConnection.and.resolveTo({ result: false });
    sqliteMock.createConnection.and.resolveTo(mockDB);

    TestBed.configureTestingModule({
      providers: [
        DatabaseService,
        // Sobrescribimos la clase SQLiteConnection con un mock vacío
        { provide: SQLiteConnection, useValue: {} }
      ]
    });

    service = TestBed.inject(DatabaseService);

    // Inyectamos el mock tipado en el servicio
    (service as unknown as { sqlite: SQLiteConnection }).sqlite = sqliteMock;
  });

  it('debe crear la conexión y ejecutar el SCHEMA si no existe conexión previa', async () => {
    const db = await service.getDb();

    expect(sqliteMock.addUpgradeStatement).toHaveBeenCalled();
    expect(sqliteMock.checkConnectionsConsistency).toHaveBeenCalled();
    expect(sqliteMock.isConnection).toHaveBeenCalled();

    expect(sqliteMock.createConnection).toHaveBeenCalledWith(
      'recetapps',
      false,
      'no-encryption',
      3,
      false
    );

    expect(mockDB.open).toHaveBeenCalled();
    expect(mockDB.execute).toHaveBeenCalled();
    expect(db).toBe(mockDB);
  });

  it('debe devolver la misma promesa en llamadas múltiples a getDb()', async () => {
    const p1 = service.getDb();
    const p2 = service.getDb();

    expect(p1).toBe(p2);

    const db1 = await p1;
    const db2 = await p2;

    expect(db1).toBe(db2);
  });

  it('debe recuperar la conexión existente si es consistente y está abierta', async () => {
    sqliteMock.checkConnectionsConsistency.and.resolveTo({ result: true });
    sqliteMock.isConnection.and.resolveTo({ result: true });
    sqliteMock.retrieveConnection.and.resolveTo(mockDB);

    const db = await service.getDb();

    expect(sqliteMock.retrieveConnection).toHaveBeenCalledWith('recetapps', false);
    expect(mockDB.open).not.toHaveBeenCalled();
    expect(mockDB.execute).not.toHaveBeenCalled();
    expect(db).toBe(mockDB);
  });

  it('debe registrar upgrade statements antes de abrir la BD', async () => {
    await service.getDb();

    expect(sqliteMock.addUpgradeStatement).toHaveBeenCalledWith('recetapps', [
      {
        toVersion: 2,
        statements: [
          'ALTER TABLE recipe_images ADD COLUMN pending_sync INTEGER NOT NULL DEFAULT 0;',
        ],
      },
      {
        toVersion: 3,
        statements: [
          `CREATE TABLE recipe_images_new (
             id               INTEGER NOT NULL,
             recipe_client_id TEXT NOT NULL,
             filename         TEXT,
             url              TEXT,
             created_at       TEXT,
             pending_sync     INTEGER NOT NULL DEFAULT 0,
             PRIMARY KEY (recipe_client_id, id)
           );`,
          `INSERT OR IGNORE INTO recipe_images_new SELECT id, recipe_client_id, filename, url, created_at, pending_sync FROM recipe_images;`,
          `DROP TABLE recipe_images;`,
          `ALTER TABLE recipe_images_new RENAME TO recipe_images;`,
        ],
      },
    ]);
  });
});
