import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { RecipeHttpRepository } from './recipe-http.repository';
import { RecipeRepository } from '../domain/recipe.repository';
import { ImageCacheService } from '../../shared/infrastructure/image-cache.service';
import { environment } from '../../../environments/environment';
import { RecipeSummary, Recipe, RecipeImage } from '../domain/recipe.model';

const API_URL = `${environment.apiUrl}/recipes`;

const REMOTE_IMAGE_URL = `${environment.apiUrl}/recipes/1/images/photo.jpg`;
const BLOB_URL = 'blob:mock-photo';

const SUMMARY_WITH_IMAGE: RecipeSummary = {
  id: 1,
  title: 'Paella',
  firstImageUrl: '/recipes/1/images/photo.jpg',
  prepTime: 20,
  cookTime: 40,
  servings: 4,
};

const SUMMARY_NO_IMAGE: RecipeSummary = {
  id: 2,
  title: 'Tortilla',
  firstImageUrl: null,
  prepTime: 10,
  cookTime: 15,
  servings: 2,
};

const RECIPE_WITH_IMAGE: Recipe = {
  id: 1,
  title: 'Paella',
  ingredients: 'arroz',
  instructions: 'Cocinar',
  prepTime: 20,
  cookTime: 40,
  servings: 4,
  images: [{ id: 10, filename: 'photo.jpg', url: '/recipes/1/images/photo.jpg' }],
};

describe('RecipeHttpRepository (image cache)', () => {
  let repository: RecipeRepository;
  let httpTesting: HttpTestingController;
  let imageCacheSpy: jasmine.SpyObj<ImageCacheService>;

  beforeEach(() => {
    imageCacheSpy = jasmine.createSpyObj<ImageCacheService>('ImageCacheService', [
      'getCachedUrl',
      'fetchAndCache',
      'preCacheInBackground',
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: RecipeRepository, useClass: RecipeHttpRepository },
        { provide: ImageCacheService, useValue: imageCacheSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    repository = TestBed.inject(RecipeRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // ── getAll() ─────────────────────────────────────────────────────────────────

  describe('getAll()', () => {
    it('should use the blob URL from cache when the image is already cached', fakeAsync(() => {
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(BLOB_URL));
      let result: RecipeSummary[] | undefined;

      repository.getAll().subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush([SUMMARY_WITH_IMAGE]);
      flushMicrotasks();

      expect(result?.[0].firstImageUrl).toBe(BLOB_URL);
    }));

    it('should call fetchAndCache and use the returned blob URL when the image is not cached', fakeAsync(() => {
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(null));
      imageCacheSpy.fetchAndCache.and.returnValue(Promise.resolve(BLOB_URL));
      let result: RecipeSummary[] | undefined;

      repository.getAll().subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush([SUMMARY_WITH_IMAGE]);
      flushMicrotasks();

      expect(imageCacheSpy.fetchAndCache).toHaveBeenCalledWith(REMOTE_IMAGE_URL);
      expect(result?.[0].firstImageUrl).toBe(BLOB_URL);
    }));

    it('should fall back to the remote URL when fetchAndCache fails', fakeAsync(() => {
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(null));
      imageCacheSpy.fetchAndCache.and.returnValue(Promise.reject(new Error('Network error')));
      let result: RecipeSummary[] | undefined;

      repository.getAll().subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush([SUMMARY_WITH_IMAGE]);
      flushMicrotasks();

      expect(result?.[0].firstImageUrl).toBe(REMOTE_IMAGE_URL);
    }));

    it('should not modify a firstImageUrl that is already an absolute URL', fakeAsync(() => {
      const absoluteUrl = 'https://cdn.example.com/photo.jpg';
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(null));
      imageCacheSpy.fetchAndCache.and.returnValue(Promise.resolve(BLOB_URL));
      let result: RecipeSummary[] | undefined;
      console.log(result);

      repository.getAll().subscribe((r) => (result = r));
      httpTesting
        .expectOne(API_URL)
        .flush([{ ...SUMMARY_WITH_IMAGE, firstImageUrl: absoluteUrl }]);
      flushMicrotasks();

      expect(imageCacheSpy.fetchAndCache).toHaveBeenCalledWith(absoluteUrl);
    }));

    it('should leave firstImageUrl as null when the summary has no image', fakeAsync(() => {
      let result: RecipeSummary[] | undefined;

      repository.getAll().subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush([SUMMARY_NO_IMAGE]);
      flushMicrotasks();

      expect(imageCacheSpy.getCachedUrl).not.toHaveBeenCalled();
      expect(result?.[0].firstImageUrl).toBeNull();
    }));
  });

  // ── getById() ────────────────────────────────────────────────────────────────

  describe('getById()', () => {
    it('should resolve image URLs through the cache service when not cached', fakeAsync(() => {
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(null));
      imageCacheSpy.fetchAndCache.and.returnValue(Promise.resolve(BLOB_URL));
      let result: Recipe | undefined;

      repository.getById(1).subscribe((r) => (result = r));
      httpTesting.expectOne(`${API_URL}/1`).flush(RECIPE_WITH_IMAGE);
      flushMicrotasks();

      expect(result?.images?.[0].url).toBe(BLOB_URL);
    }));

    it('should use the blob URL directly when the image is already cached', fakeAsync(() => {
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(BLOB_URL));
      let result: Recipe | undefined;

      repository.getById(1).subscribe((r) => (result = r));
      httpTesting.expectOne(`${API_URL}/1`).flush(RECIPE_WITH_IMAGE);
      flushMicrotasks();

      expect(imageCacheSpy.fetchAndCache).not.toHaveBeenCalled();
      expect(result?.images?.[0].url).toBe(BLOB_URL);
    }));

    it('should return the recipe unchanged when it has no images', fakeAsync(() => {
      const recipeNoImages: Recipe = { ...RECIPE_WITH_IMAGE, images: [] };
      let result: Recipe | undefined;

      repository.getById(1).subscribe((r) => (result = r));
      httpTesting.expectOne(`${API_URL}/1`).flush(recipeNoImages);
      flushMicrotasks();

      expect(imageCacheSpy.getCachedUrl).not.toHaveBeenCalled();
      expect(result?.images).toEqual([]);
    }));
  });

  // ── create() ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should POST to the recipes endpoint and return the mapped recipe', () => {
      let result: Recipe | undefined;

      repository.create(RECIPE_WITH_IMAGE).subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush(RECIPE_WITH_IMAGE);

      expect(result?.id).toBe(1);
      expect(result?.title).toBe('Paella');
    });

    it('should map image URLs to absolute URLs', () => {
      let result: Recipe | undefined;

      repository.create(RECIPE_WITH_IMAGE).subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush(RECIPE_WITH_IMAGE);

      expect(result?.images?.[0].url).toBe(`${environment.apiUrl}/recipes/1/images/photo.jpg`);
    });
  });

  // ── update() ─────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should PUT to the correct endpoint and return the mapped recipe', () => {
      let result: Recipe | undefined;

      repository.update(1, RECIPE_WITH_IMAGE).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${API_URL}/1`);

      expect(req.request.method).toBe('PUT');
      req.flush(RECIPE_WITH_IMAGE);

      expect(result?.id).toBe(1);
    });

    it('should map image URLs to absolute URLs', () => {
      let result: Recipe | undefined;

      repository.update(1, RECIPE_WITH_IMAGE).subscribe((r) => (result = r));
      httpTesting.expectOne(`${API_URL}/1`).flush(RECIPE_WITH_IMAGE);

      expect(result?.images?.[0].url).toBe(`${environment.apiUrl}/recipes/1/images/photo.jpg`);
    });
  });

  // ── delete() ─────────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should DELETE the correct endpoint', () => {
      repository.delete(1).subscribe();
      const req = httpTesting.expectOne(`${API_URL}/1`);

      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ── getByUser() ───────────────────────────────────────────────────────────────

  describe('getByUser()', () => {
    it('should GET the correct endpoint and return a mapped array', () => {
      let result: Recipe[] | undefined;

      repository.getByUser(42).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${API_URL}/user/42`);

      expect(req.request.method).toBe('GET');
      req.flush([RECIPE_WITH_IMAGE]);

      expect(result?.length).toBe(1);
      expect(result?.[0].id).toBe(1);
    });

    it('should map image URLs to absolute URLs', () => {
      let result: Recipe[] | undefined;

      repository.getByUser(42).subscribe((r) => (result = r));
      httpTesting.expectOne(`${API_URL}/user/42`).flush([RECIPE_WITH_IMAGE]);

      expect(result?.[0].images?.[0].url).toBe(`${environment.apiUrl}/recipes/1/images/photo.jpg`);
    });
  });

  // ── search() ─────────────────────────────────────────────────────────────────

  describe('search()', () => {
    it('should GET the search endpoint with the keyword param', () => {
      let result: Recipe[] | undefined;

      repository.search('paella').subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${API_URL}/search?keyword=paella`);

      expect(req.request.method).toBe('GET');
      req.flush([RECIPE_WITH_IMAGE]);

      expect(result?.length).toBe(1);
    });

    it('should return an empty array when no results', () => {
      let result: Recipe[] | undefined;

      repository.search('xyz').subscribe((r) => (result = r));
      httpTesting.expectOne(`${API_URL}/search?keyword=xyz`).flush([]);

      expect(result).toEqual([]);
    });
  });

  // ── getByCategory() ───────────────────────────────────────────────────────────

  describe('getByCategory()', () => {
    it('should GET the correct endpoint and return a mapped array', () => {
      let result: Recipe[] | undefined;

      repository.getByCategory(5).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${API_URL}/category/5`);

      expect(req.request.method).toBe('GET');
      req.flush([RECIPE_WITH_IMAGE]);

      expect(result?.length).toBe(1);
      expect(result?.[0].id).toBe(1);
    });
  });

  // ── getFavorites() ────────────────────────────────────────────────────────────

  describe('getFavorites()', () => {
    it('should GET the favorites endpoint and return a mapped array', () => {
      let result: Recipe[] | undefined;

      repository.getFavorites().subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${API_URL}/favorites`);

      expect(req.request.method).toBe('GET');
      req.flush([RECIPE_WITH_IMAGE]);

      expect(result?.length).toBe(1);
      expect(result?.[0].id).toBe(1);
    });

    it('should return an empty array when there are no favorites', () => {
      let result: Recipe[] | undefined;

      repository.getFavorites().subscribe((r) => (result = r));
      httpTesting.expectOne(`${API_URL}/favorites`).flush([]);

      expect(result).toEqual([]);
    });
  });

  // ── updateCategories() ────────────────────────────────────────────────────────

  describe('updateCategories()', () => {
    it('should PATCH the correct endpoint with category IDs', () => {
      let result: Recipe | undefined;

      repository.updateCategories(1, [3, 7]).subscribe((r) => (result = r));
      const req = httpTesting.expectOne(`${API_URL}/1/categories`);

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual([3, 7]);
      req.flush(RECIPE_WITH_IMAGE);

      expect(result?.id).toBe(1);
    });
  });

  // ── uploadImage() ────────────────────────────────────────────────────────────

  describe('uploadImage()', () => {
    it('should resolve the returned image URL through the cache service', fakeAsync(() => {
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(null));
      imageCacheSpy.fetchAndCache.and.returnValue(Promise.resolve(BLOB_URL));
      let result: RecipeImage | undefined;

      repository
        .uploadImage(1, new File([''], 'photo.jpg', { type: 'image/jpeg' }))
        .subscribe((r) => (result = r));

      const serverImage: RecipeImage = { id: 10, filename: 'photo.jpg', url: '/recipes/1/images/photo.jpg' };
      httpTesting.expectOne(`${API_URL}/1/images`).flush(serverImage);
      flushMicrotasks();

      expect(result?.url).toBe(BLOB_URL);
    }));

    it('should fall back to the remote URL when the cache fetch fails', fakeAsync(() => {
      imageCacheSpy.getCachedUrl.and.returnValue(Promise.resolve(null));
      imageCacheSpy.fetchAndCache.and.returnValue(Promise.reject(new Error('Network error')));
      let result: RecipeImage | undefined;

      repository
        .uploadImage(1, new File([''], 'photo.jpg', { type: 'image/jpeg' }))
        .subscribe((r) => (result = r));

      const serverImage: RecipeImage = { id: 10, filename: 'photo.jpg', url: '/recipes/1/images/photo.jpg' };
      httpTesting.expectOne(`${API_URL}/1/images`).flush(serverImage);
      flushMicrotasks();

      expect(result?.url).toBe(REMOTE_IMAGE_URL);
    }));
  });
});
