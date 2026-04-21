import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FavoriteService } from './favorite.service';
import { FavoriteRepository } from '../domain/favorite.repository';
import { RecipeSummary } from '../../recipes/domain/recipe.model';

const MOCK_SUMMARIES: RecipeSummary[] = [
  { id: 1, title: 'Paella', prepTime: 10, cookTime: 20, servings: 2, firstImageUrl: null },
  { id: 3, title: 'Tortilla', prepTime: 5, cookTime: 10, servings: 2, firstImageUrl: null },
];

describe('FavoriteService', () => {
  let service: FavoriteService;
  let repositorySpy: jasmine.SpyObj<FavoriteRepository>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<FavoriteRepository>('FavoriteRepository', [
      'getMyFavorites', 'isFavorite', 'addFavorite', 'removeFavorite',
    ]);

    TestBed.configureTestingModule({
      providers: [
        FavoriteService,
        { provide: FavoriteRepository, useValue: repositorySpy },
      ],
    });

    service = TestBed.inject(FavoriteService);
  });

  describe('initial state', () => {
    it('should start with an empty favoriteIds set', () => {
      expect(service.favoriteIds().size).toBe(0);
    });

    it('isFavorite() should return false for any id before loading', () => {
      expect(service.isFavorite(1)).toBeFalse();
    });
  });

  describe('loadFavorites()', () => {
    it('should call repository.getMyFavorites', () => {
      repositorySpy.getMyFavorites.and.returnValue(of([]));

      service.loadFavorites().subscribe();

      expect(repositorySpy.getMyFavorites).toHaveBeenCalledTimes(1);
    });

    it('should populate favoriteIds from the returned recipes', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));

      service.loadFavorites().subscribe();

      expect(service.favoriteIds()).toEqual(new Set([1, 3]));
    });

    it('should return the full list of RecipeSummary', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));
      let result: RecipeSummary[] | undefined;

      service.loadFavorites().subscribe((r) => (result = r));

      expect(result).toEqual(MOCK_SUMMARIES);
    });

    it('should clear favoriteIds when response is empty', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));
      service.loadFavorites().subscribe();

      repositorySpy.getMyFavorites.and.returnValue(of([]));
      service.loadFavorites().subscribe();

      expect(service.favoriteIds().size).toBe(0);
    });
  });

  describe('isFavorite()', () => {
    it('should return true for an id present in favoriteIds', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));
      service.loadFavorites().subscribe();

      expect(service.isFavorite(1)).toBeTrue();
    });

    it('should return false for an id not in favoriteIds', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));
      service.loadFavorites().subscribe();

      expect(service.isFavorite(99)).toBeFalse();
    });
  });

  describe('addFavorite()', () => {
    it('should call repository.addFavorite with the recipe id', () => {
      repositorySpy.addFavorite.and.returnValue(of(undefined));

      service.addFavorite(5).subscribe();

      expect(repositorySpy.addFavorite).toHaveBeenCalledOnceWith(5);
    });

    it('should add the id to favoriteIds on success', () => {
      repositorySpy.addFavorite.and.returnValue(of(undefined));

      service.addFavorite(5).subscribe();

      expect(service.isFavorite(5)).toBeTrue();
    });

    it('should not modify favoriteIds on error', () => {
      repositorySpy.addFavorite.and.returnValue(throwError(() => new Error('Network error')));

      service.addFavorite(5).subscribe({ error: () => { console.warn('Error adding favorite'); } });

      expect(service.isFavorite(5)).toBeFalse();
    });

    it('should preserve existing favorites when adding a new one', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));
      service.loadFavorites().subscribe();
      repositorySpy.addFavorite.and.returnValue(of(undefined));

      service.addFavorite(7).subscribe();

      expect(service.favoriteIds()).toEqual(new Set([1, 3, 7]));
    });
  });

  describe('removeFavorite()', () => {
    beforeEach(() => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));
      service.loadFavorites().subscribe();
    });

    it('should call repository.removeFavorite with the recipe id', () => {
      repositorySpy.removeFavorite.and.returnValue(of(undefined));

      service.removeFavorite(1).subscribe();

      expect(repositorySpy.removeFavorite).toHaveBeenCalledOnceWith(1);
    });

    it('should remove the id from favoriteIds on success', () => {
      repositorySpy.removeFavorite.and.returnValue(of(undefined));

      service.removeFavorite(1).subscribe();

      expect(service.isFavorite(1)).toBeFalse();
    });

    it('should leave other favorites untouched', () => {
      repositorySpy.removeFavorite.and.returnValue(of(undefined));

      service.removeFavorite(1).subscribe();

      expect(service.isFavorite(3)).toBeTrue();
    });

    it('should not modify favoriteIds on error', () => {
      repositorySpy.removeFavorite.and.returnValue(throwError(() => new Error('Network error')));

      service.removeFavorite(1).subscribe({ error: () => { console.warn('Error removing favorite'); } });

      expect(service.isFavorite(1)).toBeTrue();
    });
  });
});
