import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FavoriteHttpRepository } from './favorite-http.repository';
import { FavoriteRepository } from '../domain/favorite.repository';
import { environment } from '../../../environments/environment';
import { RecipeSummary } from '../../recipes/domain/recipe.model';

const API_URL = `${environment.apiUrl}/users/me/favorites`;

const MOCK_RESPONSE: RecipeSummary[] = [
  { id: 1, title: 'Huevo frito', firstImageUrl: null, prepTime: 2, cookTime: 10, servings: 1 },
  { id: 2, title: 'Tortilla de patatas', firstImageUrl: null, prepTime: 10, cookTime: 10, servings: 4 },
];

describe('FavoriteHttpRepository', () => {
  let repository: FavoriteRepository;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: FavoriteRepository, useClass: FavoriteHttpRepository },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    repository = TestBed.inject(FavoriteRepository);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  describe('getMyFavorites()', () => {
    it('should return a RecipeSummary[] using the id field from the API response', () => {
      let result: RecipeSummary[] | undefined;

      repository.getMyFavorites().subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush(MOCK_RESPONSE);

      expect(result?.map((f) => f.id)).toEqual([1, 2]);
    });

    it('should return an empty array when the API returns an empty list', () => {
      let result: RecipeSummary[] | undefined;

      repository.getMyFavorites().subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush([]);

      expect(result).toEqual([]);
    });

    it('should preserve all RecipeSummary fields from the response', () => {
      let result: RecipeSummary[] | undefined;

      repository.getMyFavorites().subscribe((r) => (result = r));
      httpTesting.expectOne(API_URL).flush(MOCK_RESPONSE);

      expect(result?.[0]).toEqual(MOCK_RESPONSE[0]);
      expect(result?.[1]).toEqual(MOCK_RESPONSE[1]);
    });

    it('should GET the correct endpoint', () => {
      repository.getMyFavorites().subscribe();
      const req = httpTesting.expectOne(API_URL);

      expect(req.request.method).toBe('GET');
    });
  });

  describe('isFavorite()', () => {
    const URL = `${environment.apiUrl}/recipes/1/favorite`;

    it('should return true when the API responds with a truthy value', () => {
      let result: boolean | undefined;

      repository.isFavorite(1).subscribe((r) => (result = r));
      httpTesting.expectOne(URL).flush({ isFavorite: true });

      expect(result).toBeTrue();
    });

    it('should return false when the API responds with a falsy value', () => {
      let result: boolean | undefined;

      repository.isFavorite(1).subscribe((r) => (result = r));
      httpTesting.expectOne(URL).flush({ isFavorite: false });

      expect(result).toBeFalse();
    });

    it('should return false when the API responds with an empty object', () => {
      let result: boolean | undefined;

      repository.isFavorite(1).subscribe((r) => (result = r));
      httpTesting.expectOne(URL).flush({});

      expect(result).toBeFalse();
    });
  });

  describe('addFavorite()', () => {
    it('should POST to the correct endpoint', () => {
      repository.addFavorite(5).subscribe();
      const req = httpTesting.expectOne(`${environment.apiUrl}/recipes/5/favorite`);

      expect(req.request.method).toBe('POST');
    });
  });

  describe('removeFavorite()', () => {
    it('should DELETE the correct endpoint', () => {
      repository.removeFavorite(5).subscribe();
      const req = httpTesting.expectOne(`${environment.apiUrl}/recipes/5/favorite`);

      expect(req.request.method).toBe('DELETE');
    });
  });
});
