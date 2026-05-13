import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { RecipeStore } from './recipes/application/recipe.store';
import { RecipeRepository } from './recipes/domain/recipe.repository';
import { RecipeSummary } from './recipes/domain/recipe.model';

const MOCK_RECIPES: RecipeSummary[] = [
  { id: 1, title: 'Paella', firstImageUrl: null, prepTime: 20, cookTime: 40, servings: 4, categoryIds: [] },
];

describe('App', () => {
  let mockRecipeRepository: jasmine.SpyObj<RecipeRepository>;

  beforeEach(async () => {
    mockRecipeRepository = jasmine.createSpyObj('RecipeRepository', [
      'getAll', 'getById', 'create', 'update', 'delete',
      'getByUser', 'search', 'getByCategory', 'uploadImage', 'updateCategories',
    ]);

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: RecipeRepository, useValue: mockRecipeRepository },
        RecipeStore,
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    mockRecipeRepository.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('noRecipes()', () => {
    it('should be true when the store has not loaded any recipes', () => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      const fixture = TestBed.createComponent(App);
      expect(fixture.componentInstance.noRecipes()).toBeTrue();
    });

    it('should be false when the store has recipes', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of(MOCK_RECIPES));
      TestBed.createComponent(App);
      const store = TestBed.inject(RecipeStore);
      store.loadAll();
      tick();
      expect(store.recipes().length).toBeGreaterThan(0);
      // noRecipes is false once loading is done and recipes exist
      const fixture = TestBed.createComponent(App);
      expect(fixture.componentInstance.noRecipes()).toBeFalse();
    }));
  });

  describe('template', () => {
    it('should set hideFavorites on app-header when no recipes are loaded', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of([]));
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const favBtn = fixture.nativeElement.querySelector('.app-header__favorites');
      expect(favBtn.classList.contains('invisible')).toBeTrue();
    }));

    it('should clear hideFavorites on app-header when recipes are loaded', fakeAsync(() => {
      mockRecipeRepository.getAll.and.returnValue(of(MOCK_RECIPES));
      const fixture = TestBed.createComponent(App);
      const store = TestBed.inject(RecipeStore);
      store.loadAll();
      tick();
      fixture.detectChanges();

      const favBtn = fixture.nativeElement.querySelector('.app-header__favorites');
      expect(favBtn.classList.contains('invisible')).toBeFalse();
    }));
  });
});
