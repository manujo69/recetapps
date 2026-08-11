import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { RecipeStore } from './recipes/application/recipe.store';
import { RecipeRepository } from './recipes/domain/recipe.repository';
import { RecipeSummary } from './recipes/domain/recipe.model';
import { FavoriteService } from './favorites/application/favorite.service';
import { FavoriteRepository } from './favorites/domain/favorite.repository';

const MOCK_RECIPES: RecipeSummary[] = [
  { id: 1, title: 'Paella', firstImageUrl: null, prepTime: 20, cookTime: 40, servings: 4, categoryIds: [] },
];

describe('App', () => {
  let mockRecipeRepository: jasmine.SpyObj<RecipeRepository>;
  let mockFavoriteRepository: jasmine.SpyObj<FavoriteRepository>;

  beforeEach(async () => {
    mockRecipeRepository = jasmine.createSpyObj('RecipeRepository', [
      'getAll', 'getById', 'create', 'update', 'delete',
      'getByUser', 'search', 'getByCategory', 'uploadImage', 'updateCategories',
    ]);
    mockFavoriteRepository = jasmine.createSpyObj('FavoriteRepository', [
      'getMyFavorites', 'isFavorite', 'addFavorite', 'removeFavorite',
    ]);
    mockFavoriteRepository.getMyFavorites.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: RecipeRepository, useValue: mockRecipeRepository },
        RecipeStore,
        { provide: FavoriteRepository, useValue: mockFavoriteRepository },
        FavoriteService,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    mockRecipeRepository.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('template', () => {
    it('should set hideFavorites on app-header when the user has no favorites', () => {
      mockFavoriteRepository.getMyFavorites.and.returnValue(of([]));
      const fixture = TestBed.createComponent(App);
      TestBed.inject(FavoriteService).loadFavorites().subscribe();
      fixture.detectChanges();

      const favBtn = fixture.nativeElement.querySelector('.app-header__favorites');
      expect(favBtn.classList.contains('invisible')).toBeTrue();
    });

    it('should clear hideFavorites on app-header when the user has favorites', () => {
      mockFavoriteRepository.getMyFavorites.and.returnValue(of(MOCK_RECIPES));
      const fixture = TestBed.createComponent(App);
      TestBed.inject(FavoriteService).loadFavorites().subscribe();
      fixture.detectChanges();

      const favBtn = fixture.nativeElement.querySelector('.app-header__favorites');
      expect(favBtn.classList.contains('invisible')).toBeFalse();
    });
  });
});
