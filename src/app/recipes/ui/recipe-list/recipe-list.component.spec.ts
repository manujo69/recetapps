import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router, convertToParamMap } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { RecipeListComponent } from './recipe-list.component';
import { RecipeStore } from '../../application/recipe.store';
import { RecipeRepository } from '../../domain/recipe.repository';
import { RecipeSummary } from '../../domain/recipe.model';
import { FavoriteRepository } from '../../../favorites/domain/favorite.repository';
import { FavoriteService } from '../../../favorites/application/favorite.service';
import { CategoryRepository } from '../../../categories/domain/category.repository';
import { CategoryStore } from '../../../categories/application/category.store';
import { Category } from '../../../categories/domain/category.model';

const MOCK_RECIPES: RecipeSummary[] = [
  { id: 1, title: 'Paella', firstImageUrl: null, prepTime: 20, cookTime: 40, servings: 4, categoryIds: [2] },
  { id: 3, title: 'Gazpacho', firstImageUrl: null, prepTime: 10, cookTime: 0, servings: 2, categoryIds: [5] },
  { id: 2, title: 'Tortilla', firstImageUrl: null, prepTime: 5, cookTime: 10, servings: 2, categoryIds: [2, 5] },
];

const MOCK_CATEGORIES: Category[] = [
  { id: 2, name: 'Arroces' },
  { id: 5, name: 'Mediterránea' },
];

const MOCK_FAVORITES: RecipeSummary[] = [
  { id: 1, title: 'Paella', firstImageUrl: null, prepTime: 20, cookTime: 40, servings: 4 },
];

describe('RecipeListComponent', () => {
  let mockRecipeRepository: jasmine.SpyObj<RecipeRepository>;
  let mockFavoriteRepository: jasmine.SpyObj<FavoriteRepository>;
  let mockCategoryRepository: jasmine.SpyObj<CategoryRepository>;
  let queryParamMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    mockRecipeRepository = jasmine.createSpyObj('RecipeRepository', [
      'getAll', 'getById', 'create', 'update', 'delete',
      'getByUser', 'search', 'getByCategory', 'uploadImage', 'updateCategories',
    ]);

    mockFavoriteRepository = jasmine.createSpyObj('FavoriteRepository', [
      'getMyFavorites', 'isFavorite', 'addFavorite', 'removeFavorite',
    ]);

    mockCategoryRepository = jasmine.createSpyObj('CategoryRepository', [
      'getAll', 'getById', 'create', 'update', 'delete',
    ]);

    // Default stubs so ngOnInit never throws
    mockFavoriteRepository.getMyFavorites.and.returnValue(of([]));
    mockCategoryRepository.getAll.and.returnValue(of(MOCK_CATEGORIES));

    queryParamMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [RecipeListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: RecipeRepository, useValue: mockRecipeRepository },
        RecipeStore,
        { provide: FavoriteRepository, useValue: mockFavoriteRepository },
        FavoriteService,
        { provide: CategoryRepository, useValue: mockCategoryRepository },
        CategoryStore,
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMapSubject.asObservable() },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    mockRecipeRepository.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(RecipeListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with empty state before data loads', () => {
    mockRecipeRepository.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(RecipeListComponent);
    expect(fixture.componentInstance.recipes()).toEqual([]);
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('should populate recipes and stop loading on success', fakeAsync(() => {
    mockRecipeRepository.getAll.and.returnValue(of(MOCK_RECIPES));
    const fixture = TestBed.createComponent(RecipeListComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.recipes().length).toBe(3);
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.error()).toBeNull();
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockRecipeRepository.getAll.and.returnValue(throwError(() => new Error('Error al cargar las recetas')));
    const fixture = TestBed.createComponent(RecipeListComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.error()).toBe('Error al cargar las recetas');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.recipes()).toEqual([]);
  }));

  describe('recipes() - ordering', () => {
    it('should sort recipes by id descending', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of(MOCK_RECIPES));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      const ids = fixture.componentInstance.recipes().map((r) => r.id);
      expect(ids).toEqual([3, 2, 1]);
    }));
  });

  describe('recipes() - category filtering', () => {
    it('should return all recipes when no category filter is active', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of(MOCK_RECIPES));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.recipes().length).toBe(3);
    }));

    it('should filter recipes by categoryId when a filter is active', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of(MOCK_RECIPES));
      queryParamMapSubject.next(convertToParamMap({ categoryId: '2' }));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      const filtered = fixture.componentInstance.recipes();
      expect(filtered.length).toBe(2);
      expect(filtered.every((r) => r.categoryIds?.includes(2))).toBeTrue();
    }));

    it('should update filtered recipes when the category filter changes', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of(MOCK_RECIPES));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      queryParamMapSubject.next(convertToParamMap({ categoryId: '5' }));
      fixture.detectChanges();

      const filtered = fixture.componentInstance.recipes();
      expect(filtered.every((r) => r.categoryIds?.includes(5))).toBeTrue();
    }));
  });

  describe('activeCategoryId', () => {
    it('should be null when no categoryId query param is present', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.activeCategoryId()).toBeNull();
    }));

    it('should parse categoryId from query param as a number', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      queryParamMapSubject.next(convertToParamMap({ categoryId: '5' }));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.activeCategoryId()).toBe(5);
    }));
  });

  describe('activeCategory()', () => {
    it('should return null when no category filter is active', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.activeCategory()).toBeNull();
    }));

    it('should return the matching category when a filter is active', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      queryParamMapSubject.next(convertToParamMap({ categoryId: '2' }));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.activeCategory()).toEqual({ id: 2, name: 'Arroces' });
    }));

    it('should return null when the categoryId does not match any loaded category', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      queryParamMapSubject.next(convertToParamMap({ categoryId: '99' }));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.activeCategory()).toBeNull();
    }));
  });

  describe('favoriteIds', () => {
    it('should start as an empty set', () => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      const fixture = TestBed.createComponent(RecipeListComponent);
      expect(fixture.componentInstance.favoriteIds().size).toBe(0);
    });

    it('should populate favoriteIds from getMyFavorites on init', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      mockFavoriteRepository.getMyFavorites.and.returnValue(of(MOCK_FAVORITES));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.favoriteIds()).toEqual(new Set([1]));
    }));

    it('should remain empty when getMyFavorites fails', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      mockFavoriteRepository.getMyFavorites.and.returnValue(throwError(() => new Error('Unauthorized')));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.favoriteIds().size).toBe(0);
    }));
  });

  describe('clearFilter()', () => {
    it('should navigate to current route with empty query params', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      const fixture = TestBed.createComponent(RecipeListComponent);
      fixture.detectChanges();
      tick();

      const router = TestBed.inject(Router);
      const navigateSpy = spyOn(router, 'navigate');

      fixture.componentInstance.clearFilter();

      expect(navigateSpy).toHaveBeenCalledOnceWith([], { queryParams: {} });
    }));
  });
});
