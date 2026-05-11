import { TestBed } from '@angular/core/testing';
import { SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  let service: DatabaseService;
  let sqliteSpy: jasmine.SpyObj<SQLiteConnection>;
  let dbSpy: jasmine.SpyObj<SQLiteDBConnection>;

  beforeEach(() => {
    dbSpy = jasmine.createSpyObj<SQLiteDBConnection>('SQLiteDBConnection', [
      'open',
      'execute',
      'executeSet',
    ]);
    dbSpy.open.and.resolveTo(undefined);
    dbSpy.execute.and.resolveTo({ changes: { changes: 1 } });
    dbSpy.executeSet.and.resolveTo({ changes: { changes: 6 } });

    sqliteSpy = jasmine.createSpyObj<SQLiteConnection>('SQLiteConnection', [
      'addUpgradeStatement',
      'checkConnectionsConsistency',
      'isConnection',
      'retrieveConnection',
      'createConnection',
    ]);
    sqliteSpy.addUpgradeStatement.and.resolveTo(undefined);
    sqliteSpy.checkConnectionsConsistency.and.resolveTo({ result: false });
    sqliteSpy.isConnection.and.resolveTo({ result: false });
    sqliteSpy.createConnection.and.resolveTo(dbSpy);
    sqliteSpy.retrieveConnection.and.resolveTo(dbSpy);

    TestBed.configureTestingModule({ providers: [DatabaseService] });
    service = TestBed.inject(DatabaseService);
    (service as unknown as { sqlite: SQLiteConnection }).sqlite = sqliteSpy;
  });

  describe('getDb()', () => {
    it('returns a db connection after successful init', async () => {
      const db = await service.getDb();
      expect(db).toBe(dbSpy);
    });

    it('returns the same promise on repeated calls', () => {
      const p1 = service.getDb();
      const p2 = service.getDb();
      expect(p1).toBe(p2);
    });

    it('initialises only once across concurrent calls', async () => {
      await Promise.all([service.getDb(), service.getDb(), service.getDb()]);
      expect(sqliteSpy.addUpgradeStatement).toHaveBeenCalledTimes(1);
    });

    it('registers upgrade statements for v2 and v3', async () => {
      await service.getDb();

      expect(sqliteSpy.addUpgradeStatement).toHaveBeenCalledWith('recetapps', [
        jasmine.objectContaining({ toVersion: 2 }),
        jasmine.objectContaining({ toVersion: 3 }),
      ]);
    });

    describe('when no connection is open', () => {
      it('creates a new connection with the correct parameters', async () => {
        await service.getDb();
        expect(sqliteSpy.createConnection).toHaveBeenCalledWith(
          'recetapps',
          false,
          'no-encryption',
          3,
          false,
        );
      });

      it('opens the connection and executes the schema', async () => {
        await service.getDb();
        expect(dbSpy.open).toHaveBeenCalled();
        expect(dbSpy.execute).toHaveBeenCalledWith(
          jasmine.stringContaining('CREATE TABLE IF NOT EXISTS recipes'),
        );
      });

      it('does not call retrieveConnection', async () => {
        await service.getDb();
        expect(sqliteSpy.retrieveConnection).not.toHaveBeenCalled();
      });
    });

    describe('when connection is consistent but not open', () => {
      beforeEach(() => {
        sqliteSpy.checkConnectionsConsistency.and.resolveTo({ result: true });
        sqliteSpy.isConnection.and.resolveTo({ result: false });
      });

      it('creates a new connection rather than retrieving', async () => {
        await service.getDb();
        expect(sqliteSpy.createConnection).toHaveBeenCalled();
        expect(sqliteSpy.retrieveConnection).not.toHaveBeenCalled();
      });
    });

    describe('when connection is consistent and open', () => {
      beforeEach(() => {
        sqliteSpy.checkConnectionsConsistency.and.resolveTo({ result: true });
        sqliteSpy.isConnection.and.resolveTo({ result: true });
      });

      it('retrieves the existing connection', async () => {
        const db = await service.getDb();
        expect(sqliteSpy.retrieveConnection).toHaveBeenCalledWith('recetapps', false);
        expect(db).toBe(dbSpy);
      });

      it('does not create a new connection or execute schema', async () => {
        await service.getDb();
        expect(sqliteSpy.createConnection).not.toHaveBeenCalled();
        expect(dbSpy.open).not.toHaveBeenCalled();
        expect(dbSpy.execute).not.toHaveBeenCalled();
      });
    });
  });

  describe('clearUserData()', () => {
    it('deletes all user tables', async () => {
      await service.clearUserData();

      expect(dbSpy.executeSet).toHaveBeenCalledWith([
        { statement: 'DELETE FROM favorites;', values: [] },
        { statement: 'DELETE FROM recipe_images;', values: [] },
        { statement: 'DELETE FROM recipe_categories;', values: [] },
        { statement: 'DELETE FROM recipes;', values: [] },
        { statement: 'DELETE FROM categories;', values: [] },
        { statement: 'DELETE FROM sync_meta;', values: [] },
      ]);
    });

    it('clears image cache after executing table deletes', async () => {
      // Capacitor's Filesystem proxy cannot be spied on directly; we spy on the private method.
      const svc = service as unknown as { clearImageCache(): Promise<void> };
      const clearImageCacheSpy = spyOn(svc, 'clearImageCache').and.resolveTo(undefined);

      const order: string[] = [];
      dbSpy.executeSet.and.callFake(async () => { order.push('executeSet'); return { changes: { changes: 0 } }; });
      clearImageCacheSpy.and.callFake(async () => { order.push('clearImageCache'); });

      await service.clearUserData();

      expect(order).toEqual(['executeSet', 'clearImageCache']);
    });
  });

  describe('clearImageCache()', () => {
    it('resolves even when the image cache directory does not exist', async () => {
      // In ChromeHeadless the Filesystem web plugin uses IndexedDB; the folder never exists,
      // so rmdir throws "Folder does not exist." — clearImageCache must swallow that error.
      const svc = service as unknown as { clearImageCache(): Promise<void> };
      await expectAsync(svc.clearImageCache()).toBeResolved();
    });
  });
});
