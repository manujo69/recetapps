import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { signal, WritableSignal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { FavoriteService } from './favorite.service';
import { FavoriteRepository } from '../domain/favorite.repository';
import { NetworkService } from '../../shared/infrastructure/network.service';
import { SyncService } from '../../sync/application/sync.service';
import { RecipeSummary } from '../../recipes/domain/recipe.model';

const MOCK_SUMMARIES: RecipeSummary[] = [
  { id: 1, title: 'Paella', prepTime: 10, cookTime: 20, servings: 2, firstImageUrl: null },
  { id: 3, title: 'Tortilla', prepTime: 5, cookTime: 10, servings: 2, firstImageUrl: null },
];

describe('FavoriteService', () => {
  let service: FavoriteService;
  let repositorySpy: jasmine.SpyObj<FavoriteRepository>;
  let mockSyncService: jasmine.SpyObj<SyncService>;
  let pullCompletedAt: WritableSignal<number>;
  let isOnline: WritableSignal<boolean>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<FavoriteRepository>('FavoriteRepository', [
      'getMyFavorites', 'isFavorite', 'addFavorite', 'removeFavorite',
    ]);

    mockSyncService = jasmine.createSpyObj('SyncService', ['push']);
    mockSyncService.push.and.returnValue(Promise.resolve());

    pullCompletedAt = signal(0);
    isOnline = signal(true);

    TestBed.configureTestingModule({
      providers: [
        FavoriteService,
        { provide: FavoriteRepository, useValue: repositorySpy },
        { provide: NetworkService, useValue: { pullCompletedAt, isOnline } },
        { provide: SyncService, useValue: mockSyncService },
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

  describe('pullCompletedAt effect', () => {
    it('should reload favorites when pullCompletedAt increases', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));

      pullCompletedAt.set(1);
      TestBed.flushEffects();

      expect(repositorySpy.getMyFavorites).toHaveBeenCalledTimes(1);
      expect(service.favoriteIds()).toEqual(new Set([1, 3]));
    });

    it('should not reload favorites when pullCompletedAt is 0', () => {
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));

      TestBed.flushEffects();

      expect(repositorySpy.getMyFavorites).not.toHaveBeenCalled();
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

  describe('pushIfOnline()', () => {
    it('should not push on web platform', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      repositorySpy.addFavorite.and.returnValue(of(undefined));

      service.addFavorite(1).subscribe();

      expect(mockSyncService.push).not.toHaveBeenCalled();
    });

    it('should not push when native platform and offline', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      isOnline.set(false);
      repositorySpy.addFavorite.and.returnValue(of(undefined));

      service.addFavorite(1).subscribe();

      expect(mockSyncService.push).not.toHaveBeenCalled();
    });

    it('should push when native platform and online', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      isOnline.set(true);
      repositorySpy.addFavorite.and.returnValue(of(undefined));

      service.addFavorite(1).subscribe();

      expect(mockSyncService.push).toHaveBeenCalledTimes(1);
    });

    it('should push via removeFavorite when native and online', () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      isOnline.set(true);
      repositorySpy.getMyFavorites.and.returnValue(of(MOCK_SUMMARIES));
      service.loadFavorites().subscribe();
      repositorySpy.removeFavorite.and.returnValue(of(undefined));

      service.removeFavorite(1).subscribe();

      expect(mockSyncService.push).toHaveBeenCalledTimes(1);
    });
  });
});
