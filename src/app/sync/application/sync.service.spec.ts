import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { SyncService } from './sync.service';
import { DatabaseService } from '../../shared/infrastructure/database.service';
import { environment } from '../../../environments/environment';

import { RecipeAggregatedRow } from '../../recipes/infrastructure/recipe-sqlite.types';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

const SYNC_URL = `${environment.apiUrl}/sync`;

const emptySyncResponse = {
  recipes: [],
  categories: [],
  favorites: [],
  serverTime: '2026-01-01T00:00:00Z',
};

function makeRecipeRow(overrides: Partial<RecipeAggregatedRow> = {}) {
  return {
    client_id: 'c1',
    id: null,
    title: 'Paella',
    description: null,
    ingredients: 'arroz',
    instructions: 'hervir',
    prep_time: 10,
    cook_time: 20,
    servings: 2,
    user_id: null,
    username: null,
    updated_at: null,
    deleted_at: null,
    category_ids: null,
    ...overrides,
  };
}

describe('SyncService', () => {
  let service: SyncService;
  let httpTesting: HttpTestingController;
  let mockDb: { beginTransaction: jasmine.Spy; commitTransaction: jasmine.Spy; rollbackTransaction: jasmine.Spy; query: jasmine.Spy; run: jasmine.Spy };
  let mockDatabaseService: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      beginTransaction: jasmine.createSpy('beginTransaction').and.resolveTo(),
      commitTransaction: jasmine.createSpy('commitTransaction').and.resolveTo(),
      rollbackTransaction: jasmine.createSpy('rollbackTransaction').and.resolveTo(),
      query: jasmine.createSpy('query').and.resolveTo({ values: [] }),
      run: jasmine.createSpy('run').and.resolveTo(),
    };

    mockDatabaseService = jasmine.createSpyObj<DatabaseService>('DatabaseService', ['getDb', 'clearUserData']);
    mockDatabaseService.getDb.and.resolveTo(mockDb as unknown as SQLiteDBConnection);
    mockDatabaseService.clearUserData.and.resolveTo();

    TestBed.configureTestingModule({
      providers: [
        SyncService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SyncService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  // ───────────────────────────────────────────────────────────────
  // syncOnLogin
  // ───────────────────────────────────────────────────────────────

  describe('syncOnLogin()', () => {
    it('should call clearUserData then pull', fakeAsync(() => {
      service.syncOnLogin().catch(() => { console.error('syncOnLogin error in test'); });

      flushMicrotasks(); // resolves clearUserData, queues the HTTP request

      httpTesting.expectOne(SYNC_URL).flush(emptySyncResponse);
      flushMicrotasks(); // resolves pull

      expect(mockDatabaseService.clearUserData).toHaveBeenCalled();
      expect(mockDb.commitTransaction).toHaveBeenCalled();
    }));

    it('should reject and not commit when pull fails', fakeAsync(() => {
      let rejected = false;
      service.syncOnLogin().catch(() => (rejected = true));

      flushMicrotasks(); // resolves clearUserData, queues the HTTP request

      httpTesting.expectOne(SYNC_URL).flush('Server Error', { status: 500, statusText: 'Server Error' });
      flushMicrotasks(); // rejects pull

      expect(rejected).toBeTrue();
      expect(mockDb.commitTransaction).not.toHaveBeenCalled();
    }));
  });

  // ───────────────────────────────────────────────────────────────
  // pull()
  // ───────────────────────────────────────────────────────────────

  describe('pull()', () => {
    it('should GET /sync without params', async () => {
      const promise = service.pull();

      const req = httpTesting.expectOne(SYNC_URL);
      expect(req.request.method).toBe('GET');
      req.flush(emptySyncResponse);

      await promise;
    });

    it('should append ?since=', async () => {
      const since = '2026-01-01T00:00:00Z';
      const promise = service.pull(since);

      const req = httpTesting.expectOne(`${SYNC_URL}?since=${encodeURIComponent(since)}`);
      expect(req.request.method).toBe('GET');
      req.flush(emptySyncResponse);

      await promise;
    });

    it('should commit transaction on success', async () => {
      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(emptySyncResponse);
      await promise;

      expect(mockDb.beginTransaction).toHaveBeenCalled();
      expect(mockDb.commitTransaction).toHaveBeenCalled();
    });

    it('should rollback on DB error', async () => {
      mockDb.run.and.rejectWith(new Error('DB error'));

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(emptySyncResponse);

      await expectAsync(promise).toBeRejectedWithError('DB error');
      expect(mockDb.rollbackTransaction).toHaveBeenCalled();
    });

    it('should upsert recipes', async () => {
      const response = {
        ...emptySyncResponse,
        recipes: [
          {
            id: 1,
            clientId: 'c1',
            title: 'Paella',
            ingredients: 'arroz',
            instructions: 'hervir',
            prepTime: 10,
            cookTime: 20,
            servings: 2,
          },
        ],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO recipes'),
        jasmine.arrayContaining([1, 'c1', 'Paella']),
        false,
      );
    });

    it('should lookup clientId when missing', async () => {
      mockDb.query.and.callFake((sql: string) => {
        if (sql.includes('SELECT client_id FROM recipes')) {
          return Promise.resolve({ values: [{ client_id: 'existing-client' }] });
        }
        return Promise.resolve({ values: [] });
      });

      const response = {
        ...emptySyncResponse,
        recipes: [{ id: 42, title: 'Test', ingredients: 'x', instructions: 'y', prepTime: 0, cookTime: 0, servings: 1 }],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO recipes'),
        jasmine.arrayContaining(['existing-client']),
        false,
      );
    });

    it('should fallback to string(id)', async () => {
      const response = {
        ...emptySyncResponse,
        recipes: [{ id: 99, title: 'Test', ingredients: 'x', instructions: 'y', prepTime: 0, cookTime: 0, servings: 1 }],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO recipes'),
        jasmine.arrayContaining(['99']),
        false,
      );
    });

    it('should upsert categories', async () => {
      const response = {
        ...emptySyncResponse,
        categories: [{ id: 2, clientId: 'cat1', name: 'Arroces' }],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO categories'),
        jasmine.arrayContaining([2, 'cat1', 'Arroces']),
        false,
      );
    });

    it('should lookup clientId for category when server omits it', async () => {
      mockDb.query.and.callFake((sql: string) => {
        if (sql.includes('SELECT client_id FROM categories')) {
          return Promise.resolve({ values: [{ client_id: 'existing-cat' }] });
        }
        return Promise.resolve({ values: [] });
      });

      const response = {
        ...emptySyncResponse,
        categories: [{ id: 10, name: 'Sopas' }],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.query).toHaveBeenCalledWith(
        jasmine.stringContaining('SELECT client_id FROM categories WHERE id = ?'),
        [10],
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO categories'),
        jasmine.arrayContaining(['existing-cat']),
        false,
      );
    });

    it('should fallback to string(id) for category when DB lookup returns nothing', async () => {
      const response = {
        ...emptySyncResponse,
        categories: [{ id: 5, name: 'Sopas' }],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO categories'),
        jasmine.arrayContaining(['5']),
        false,
      );
    });

    it('should insert recipe_categories when recipe has categoryIds', async () => {
      const response = {
        ...emptySyncResponse,
        recipes: [{
          id: 1, clientId: 'c1', title: 'Paella', ingredients: 'arroz', instructions: 'hervir',
          prepTime: 10, cookTime: 20, servings: 2, categoryIds: [3, 7],
        }],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('DELETE FROM recipe_categories WHERE recipe_client_id = ?'),
        ['c1'],
        false,
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT OR IGNORE INTO recipe_categories'),
        ['c1', 3],
        false,
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT OR IGNORE INTO recipe_categories'),
        ['c1', 7],
        false,
      );
    });

    it('should delete and re-insert recipe_images when recipe has images', async () => {
      spyOn(window, 'fetch').and.resolveTo({ ok: false, status: 500 } as Response);
      const response = {
        ...emptySyncResponse,
        recipes: [{
          id: 1, clientId: 'c1', title: 'Paella', ingredients: 'arroz', instructions: 'hervir',
          prepTime: 10, cookTime: 20, servings: 2,
          images: [{ id: 10, url: 'http://example.com/img.jpg', filename: 'img.jpg' }],
        }],
      };
      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;
      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('DELETE FROM recipe_images WHERE recipe_client_id = ?'),
        ['c1'], false,
      );
      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT OR REPLACE INTO recipe_images'),
        [10, 'c1', 'img.jpg', 'http://example.com/img.jpg', null],
        false,
      );
    });

    it('should prefix relative image URLs with apiUrl', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.reject(new Error('network error')));
      const response = {
        ...emptySyncResponse,
        recipes: [{
          id: 1, clientId: 'c1', title: 'Paella', ingredients: 'arroz', instructions: 'hervir',
          prepTime: 10, cookTime: 20, servings: 2,
          images: [{ id: 11, url: '/uploads/img.jpg', filename: 'img.jpg' }],
        }],
      };
      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;
      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT OR REPLACE INTO recipe_images'),
        [11, 'c1', 'img.jpg', `${environment.apiUrl}/uploads/img.jpg`, null],
        false,
      );
    });

    it('should upsert favorites', async () => {
      const response = {
        ...emptySyncResponse,
        favorites: [{ recipeId: 5, updatedAt: '2026-01-01', deletedAt: null }],
      };

      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(response);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT INTO favorites'),
        [5, '2026-01-01T00:00:00.000Z', null],
        false,
      );
    });

    it('should save last_sync_at', async () => {
      const promise = service.pull();
      httpTesting.expectOne(SYNC_URL).flush(emptySyncResponse);
      await promise;

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('INSERT OR REPLACE INTO sync_meta'),
        ['2026-01-01T00:00:00Z'],
        false,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────
  // push()
  // ───────────────────────────────────────────────────────────────

  describe('push()', () => {
    // Helper: always return empty for recipe_images (prevents fetch() macrotasks in fakeAsync),
    // then delegate to the provided per-sql logic.
    function noImagesFake(perSql: (sql: string) => { values: unknown[] } | null) {
      mockDb.query.and.callFake((sql: string) => {
        if (sql.includes('recipe_images')) return Promise.resolve({ values: [] });
        const result = perSql(sql);
        return Promise.resolve(result ?? { values: [] });
      });
    }

    it('should skip HTTP when no pending data', async () => {
      await service.push();
      expect(httpTesting.match(SYNC_URL).length).toBe(0);
    });

    it('should POST pending recipes', fakeAsync(() => {
      noImagesFake((sql) => (sql.includes('recipes') ? { values: [makeRecipeRow()] } : null));

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      const req = httpTesting.expectOne(SYNC_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.recipes[0]).toEqual(
        jasmine.objectContaining({ title: 'Paella', clientId: 'c1' }),
      );
      req.flush({ recipes: [], categories: [] });
      flushMicrotasks();
    }));

    it('should apply server id mappings', fakeAsync(() => {
      noImagesFake((sql) => (sql.includes('recipes') ? { values: [makeRecipeRow()] } : null));

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      httpTesting.expectOne(SYNC_URL).flush({ recipeMappings: [{ clientId: 'c1', serverId: 42 }], categoryMappings: [] });
      flushMicrotasks();

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('UPDATE recipes SET id = ?, pending_sync = 0'),
        [42, 'c1'],
        false,
      );
    }));

    it('should mark all pending records as synced', fakeAsync(() => {
      noImagesFake((sql) => (sql.includes('recipes') ? { values: [makeRecipeRow()] } : null));

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      httpTesting.expectOne(SYNC_URL).flush({ recipes: [], categories: [] });
      flushMicrotasks();

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('UPDATE recipes SET pending_sync = 0 WHERE pending_sync = 1'),
        [],
        false,
      );
    }));

    it('should include pending categories', fakeAsync(() => {
      const categoryRow = { client_id: 'cat1', id: null, name: 'Arroces', description: null, updated_at: null, deleted_at: null };
      noImagesFake((sql) => (sql.includes('categories') ? { values: [categoryRow] } : null));

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      const req = httpTesting.expectOne(SYNC_URL);
      expect(req.request.body.categories[0]).toEqual(
        jasmine.objectContaining({ name: 'Arroces', clientId: 'cat1' }),
      );
      req.flush({ recipes: [], categories: [] });
      flushMicrotasks();
    }));

    it('should include pending favorites', fakeAsync(() => {
      const favoriteRow = { recipe_id: 7, updated_at: '2026-01-01', deleted_at: null };
      noImagesFake((sql) => (sql.includes('favorites') ? { values: [favoriteRow] } : null));

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      const req = httpTesting.expectOne(SYNC_URL);
      expect(req.request.body.favorites[0]).toEqual(jasmine.objectContaining({ recipeId: 7 }));
      req.flush({ recipes: [], categories: [] });
      flushMicrotasks();
    }));

    it('should parse category_ids comma string into array in POST body', fakeAsync(() => {
      noImagesFake((sql) =>
        sql.includes('recipes') ? { values: [makeRecipeRow({ category_ids: '3,7,12' })] } : null,
      );

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      const req = httpTesting.expectOne(SYNC_URL);
      expect(req.request.body.recipes[0].categoryIds).toEqual([3, 7, 12]);
      req.flush({ recipes: [], categories: [] });
      flushMicrotasks();
    }));

    it('should include server id in POST body when recipe was already synced', fakeAsync(() => {
      noImagesFake((sql) =>
        sql.includes('recipes') ? { values: [makeRecipeRow({ id: 42 })] } : null,
      );

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      const req = httpTesting.expectOne(SYNC_URL);
      expect(req.request.body.recipes[0]).toEqual(
        jasmine.objectContaining({ id: 42, clientId: 'c1' }),
      );
      req.flush({ recipes: [], categories: [] });
      flushMicrotasks();
    }));

    it('should apply category id mappings from server response', fakeAsync(() => {
      const categoryRow = { client_id: 'cat1', id: null, name: 'Arroces', description: null, updated_at: null, deleted_at: null };
      noImagesFake((sql) => (sql.includes('categories') ? { values: [categoryRow] } : null));

      service.push().catch((e) => console.error('push error in test', e));
      flushMicrotasks();

      httpTesting.expectOne(SYNC_URL).flush({ recipeMappings: [], categoryMappings: [{ clientId: 'cat1', serverId: 99 }] });
      flushMicrotasks();

      expect(mockDb.run).toHaveBeenCalledWith(
        jasmine.stringContaining('UPDATE categories SET id = ?, pending_sync = 0'),
        [99, 'cat1'],
        false,
      );
    }));

    it('should rollback and rethrow when applyIdMappings fails', fakeAsync(() => {
      noImagesFake((sql) => (sql.includes('recipes') ? { values: [makeRecipeRow()] } : null));
      mockDb.run.and.rejectWith(new Error('DB write error'));

      let caughtError: Error | undefined;
      service.push().catch((e) => (caughtError = e));
      flushMicrotasks();

      httpTesting.expectOne(SYNC_URL).flush({ recipeMappings: [{ clientId: 'c1', serverId: 1 }], categoryMappings: [] });
      flushMicrotasks();

      expect(caughtError?.message).toBe('DB write error');
      expect(mockDb.rollbackTransaction).toHaveBeenCalled();
    }));
  });

  // ───────────────────────────────────────────────────────────────
  // arrayBufferToBase64() (private)
  // ───────────────────────────────────────────────────────────────

  describe('arrayBufferToBase64() (private)', () => {
    it('should encode a buffer to a base64 string', () => {
      const buffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).arrayBufferToBase64(buffer);
      expect(result).toBe('SGVsbG8=');
    });

    it('should encode an empty buffer to an empty base64 string', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).arrayBufferToBase64(new ArrayBuffer(0));
      expect(result).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // cacheImage() (private)
  // ───────────────────────────────────────────────────────────────

  describe('cacheImage() (private)', () => {

    it('should call fetch to download the image when not cached locally', async () => {
      const buffer = new Uint8Array([1, 2, 3]).buffer;
      spyOn(window, 'fetch').and.resolveTo({
        ok: true,
        arrayBuffer: () => Promise.resolve(buffer),
      } as unknown as Response);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (service as any).cacheImage('http://example.com/img.jpg', 'c1', 1, 'img.jpg');
      } catch {
        // Filesystem write/getUri may fail in the test environment — that is expected
      }
      expect(window.fetch).toHaveBeenCalledWith('http://example.com/img.jpg');
    });
  });

  // ───────────────────────────────────────────────────────────────
  // pushPendingImages() (private)
  // ───────────────────────────────────────────────────────────────

  describe('pushPendingImages() (private)', () => {
    it('should query for pending images linked to synced recipes', async () => {
      mockDb.query.and.resolveTo({ values: [] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any).pushPendingImages(mockDb);
      expect(mockDb.query).toHaveBeenCalledWith(jasmine.stringContaining('recipe_images'));
    });

    it('should skip image silently when processing fails', async () => {
      const row = {
        id: -1, recipe_client_id: 'c1', filename: 'img.jpg',
        url: 'http://example.com/img.jpg', server_recipe_id: 42,
      };
      mockDb.query.and.resolveTo({ values: [row] });
      spyOn(window, 'fetch').and.resolveTo({ ok: false, status: 404 } as Response);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expectAsync((service as any).pushPendingImages(mockDb)).toBeResolved();
      expect(mockDb.run).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // getLastSyncAt()
  // ───────────────────────────────────────────────────────────────

  describe('getLastSyncAt()', () => {
    it('should return undefined when empty', async () => {
      mockDb.query.and.resolveTo({ values: [] });

      const result = await service.getLastSyncAt();
      expect(result).toBeUndefined();
    });

    it('should return stored value', async () => {
      mockDb.query.and.resolveTo({
        values: [{ value: '2026-01-01T00:00:00Z' }],
      });

      const result = await service.getLastSyncAt();
      expect(result).toBe('2026-01-01T00:00:00Z');
    });
  });
});
