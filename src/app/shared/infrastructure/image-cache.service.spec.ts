import { TestBed } from '@angular/core/testing';
import { ImageCacheService } from './image-cache.service';

const REMOTE_URL = 'https://example.com/img.jpg';

const freshResponse = (data = 'data') =>
  new Response(new Blob([data], { type: 'image/jpeg' }), { status: 200 });

describe('ImageCacheService', () => {
  let service: ImageCacheService;
  let mockCache: jasmine.SpyObj<Cache>;

  beforeEach(() => {
    mockCache = jasmine.createSpyObj<Cache>('Cache', ['match', 'put']);
    mockCache.put.and.returnValue(Promise.resolve());
    spyOn(caches, 'open').and.returnValue(Promise.resolve(mockCache));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:mock');

    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageCacheService);
  });

  // ── getCachedUrl() ───────────────────────────────────────────────────────────

  describe('getCachedUrl()', () => {
    it('should return null when the URL is not in the cache', async () => {
      mockCache.match.and.returnValue(Promise.resolve(undefined));

      const result = await service.getCachedUrl(REMOTE_URL);

      expect(result).toBeNull();
    });

    it('should return a blob URL when the URL is found in the cache', async () => {
      mockCache.match.and.callFake(() => Promise.resolve(freshResponse()));

      const result = await service.getCachedUrl(REMOTE_URL);

      expect(result).toBe('blob:mock');
    });

    it('should return null when the cached response has a zero-size blob', async () => {
      mockCache.match.and.callFake(() =>
        Promise.resolve(new Response(new Blob([]), { status: 200 })),
      );

      const result = await service.getCachedUrl(REMOTE_URL);

      expect(result).toBeNull();
    });

    it('should return the in-memory blob URL on second call without hitting the Cache API', async () => {
      mockCache.match.and.callFake(() => Promise.resolve(freshResponse()));

      await service.getCachedUrl(REMOTE_URL);

      (caches.open as jasmine.Spy).calls.reset();
      const result = await service.getCachedUrl(REMOTE_URL);

      expect(caches.open).not.toHaveBeenCalled();
      expect(result).toBe('blob:mock');
    });
  });

  // ── fetchAndCache() ──────────────────────────────────────────────────────────

  describe('fetchAndCache()', () => {
    it('should fetch the image and return a blob URL', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(freshResponse()));

      const result = await service.fetchAndCache(REMOTE_URL);

      expect(result).toBe('blob:mock');
    });

    it('should store a Response in the Cache API', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(freshResponse()));

      await service.fetchAndCache(REMOTE_URL);

      expect(mockCache.put).toHaveBeenCalledOnceWith(REMOTE_URL, jasmine.any(Response));
    });

    it('should store the blob URL in memory for subsequent getCachedUrl calls', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(freshResponse()));

      await service.fetchAndCache(REMOTE_URL);

      (caches.open as jasmine.Spy).calls.reset();
      const cached = await service.getCachedUrl(REMOTE_URL);

      expect(caches.open).not.toHaveBeenCalled();
      expect(cached).toBe('blob:mock');
    });

    it('should throw when the fetch response is not ok', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(new Response(null, { status: 404 })),
      );

      await expectAsync(service.fetchAndCache(REMOTE_URL)).toBeRejectedWithError('HTTP 404');
    });

    it('should not fetch again when the URL is already in memory', async () => {
      const fetchSpy = spyOn(window, 'fetch').and.returnValue(
        Promise.resolve(freshResponse()),
      );

      await service.fetchAndCache(REMOTE_URL);
      fetchSpy.calls.reset();

      const result = await service.fetchAndCache(REMOTE_URL);

      expect(window.fetch).not.toHaveBeenCalled();
      expect(result).toBe('blob:mock');
    });
  });

  // ── preCacheInBackground() ───────────────────────────────────────────────────

  describe('preCacheInBackground()', () => {
    it('should call fetchAndCache for the given URL', () => {
      spyOn(service, 'fetchAndCache').and.returnValue(Promise.resolve('blob:mock'));

      service.preCacheInBackground(REMOTE_URL);

      expect(service.fetchAndCache).toHaveBeenCalledOnceWith(REMOTE_URL);
    });

    it('should not start a second fetch when one is already in-flight', () => {
      spyOn(service, 'fetchAndCache').and.returnValue(new Promise(() => { console.log('pending'); }));

      service.preCacheInBackground(REMOTE_URL);
      service.preCacheInBackground(REMOTE_URL);

      expect(service.fetchAndCache).toHaveBeenCalledTimes(1);
    });

    it('should not call fetchAndCache when the URL is already in memory', async () => {
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(freshResponse()));

      await service.fetchAndCache(REMOTE_URL);

      const fetchSpy = spyOn(service, 'fetchAndCache').and.returnValue(Promise.resolve('blob:mock'));
      service.preCacheInBackground(REMOTE_URL);

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });
});
