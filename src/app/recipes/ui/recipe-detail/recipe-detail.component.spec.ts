import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';
import { RecipeDetailComponent } from './recipe-detail.component';
import { RecipeStore } from '../../application/recipe.store';
import { RecipeRepository } from '../../domain/recipe.repository';
import { Recipe, RecipeImage, RecipeSummary } from '../../domain/recipe.model';
import { FavoriteRepository } from '../../../favorites/domain/favorite.repository';
import { FavoriteService } from '../../../favorites/application/favorite.service';
import { NetworkService } from '../../../shared/infrastructure/network.service';
import { SyncService } from '../../../sync/application/sync.service';
import { CategoryRepository } from '../../../categories/domain/category.repository';
import { CategoryStore } from '../../../categories/application/category.store';
import { Category } from '../../../categories/domain/category.model';

const MOCK_RECIPE: Recipe = {
  id: 1,
  title: 'Paella valenciana',
  description: 'Receta tradicional',
  ingredients: 'arroz, azafrán, pollo',
  instructions: 'Sofría el pollo, añada el arroz y el caldo.',
  prepTime: 20,
  cookTime: 40,
  servings: 4,
};

const MOCK_RECIPE_WITH_CATEGORIES: Recipe = {
  ...MOCK_RECIPE,
  categoryIds: [2, 5],
};

const MOCK_RECIPE_WITH_CATEGORY_NAMES: Recipe = {
  ...MOCK_RECIPE,
  categoryNames: ['Arroces', 'Mediterránea'],
};

const MOCK_IMAGE: RecipeImage = {
  id: 10,
  filename: 'paella.jpg',
  url: '/uploads/paella.jpg',
};

const MOCK_RECIPE_WITH_IMAGES: Recipe = {
  ...MOCK_RECIPE,
  images: [MOCK_IMAGE],
};

const MOCK_CATEGORIES: Category[] = [
  { id: 2, name: 'Arroces' },
  { id: 5, name: 'Mediterránea' },
  { id: 7, name: 'Postres' },
];

describe('RecipeDetailComponent', () => {
  let mockRecipeRepository: jasmine.SpyObj<RecipeRepository>;
  let mockFavoriteRepository: jasmine.SpyObj<FavoriteRepository>;
  let mockCategoryRepository: jasmine.SpyObj<CategoryRepository>;
  let mockSyncService: jasmine.SpyObj<SyncService>;

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

    mockSyncService = jasmine.createSpyObj('SyncService', ['push']);
    mockSyncService.push.and.returnValue(Promise.resolve());

    const mockNetworkService = { pullCompletedAt: signal(0), isOnline: signal(true) };

    // Default stubs so ngOnInit never throws
    mockFavoriteRepository.getMyFavorites.and.returnValue(of([]));
    mockCategoryRepository.getAll.and.returnValue(of(MOCK_CATEGORIES));

    await TestBed.configureTestingModule({
      imports: [RecipeDetailComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: RecipeRepository, useValue: mockRecipeRepository },
        RecipeStore,
        { provide: FavoriteRepository, useValue: mockFavoriteRepository },
        { provide: NetworkService, useValue: mockNetworkService },
        { provide: SyncService, useValue: mockSyncService },
        FavoriteService,
        { provide: CategoryRepository, useValue: mockCategoryRepository },
        CategoryStore,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with no selected recipe before loading', () => {
    mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance.recipe()).toBeNull();
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('should start with uploading as false', () => {
    mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance.uploading()).toBeFalse();
  });

  it('should load recipe by id from route params', fakeAsync(() => {
    mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.recipe()).toEqual(MOCK_RECIPE);
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.error()).toBeNull();
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockRecipeRepository.getById.and.returnValue(throwError(() => new Error('Receta no encontrada')));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.error()).toBe('Receta no encontrada');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.recipe()).toBeNull();
  }));

  it('should set isFavorite based on service response', fakeAsync(() => {
    mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
    mockFavoriteRepository.getMyFavorites.and.returnValue(of([{ id: 1 } as RecipeSummary]));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.isFavorite()).toBeTrue();
  }));

  describe('isPlaceholderImage()', () => {
    it('should be true when recipe has no images', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.isPlaceholderImage()).toBeTrue();
    }));

    it('should be false when recipe has images', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_IMAGES));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.isPlaceholderImage()).toBeFalse();
    }));
  });

  describe('imageUrl()', () => {
    it('should return placeholder image when recipe has no images', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.imageUrl()).toBe('images/ingredients-background-010.png');
    }));

    it('should return first image url when recipe has images', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_IMAGES));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.imageUrl()).toBe('/uploads/paella.jpg');
    }));
  });

  describe('toggleFavorite()', () => {
    it('should call addFavorite and set isFavorite to true when not a favorite', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockFavoriteRepository.addFavorite.and.returnValue(of(undefined));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleFavorite();
      tick();

      expect(mockFavoriteRepository.addFavorite).toHaveBeenCalledOnceWith(1);
      expect(fixture.componentInstance.isFavorite()).toBeTrue();
    }));

    it('should call removeFavorite and set isFavorite to false when already a favorite', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockFavoriteRepository.getMyFavorites.and.returnValue(of([{ id: 1 } as RecipeSummary]));
      mockFavoriteRepository.removeFavorite.and.returnValue(of(undefined));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleFavorite();
      tick();

      expect(mockFavoriteRepository.removeFavorite).toHaveBeenCalledOnceWith(1);
      expect(fixture.componentInstance.isFavorite()).toBeFalse();
    }));

    it('should revert isFavorite on error', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockFavoriteRepository.addFavorite.and.returnValue(throwError(() => new Error('Server error')));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleFavorite();
      tick();

      expect(fixture.componentInstance.isFavorite()).toBeFalse();
    }));
  });

  describe('toggleCategoryPanel()', () => {
    it('should open the panel when closed', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();

      expect(fixture.componentInstance.showCategoryPanel()).toBeTrue();
    }));

    it('should close the panel when open', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();
      fixture.componentInstance.toggleCategoryPanel();

      expect(fixture.componentInstance.showCategoryPanel()).toBeFalse();
    }));

    it('should populate selectedCategoryIds from categoryIds when opening', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_CATEGORIES));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();

      expect(fixture.componentInstance.selectedCategoryIds()).toEqual(new Set([2, 5]));
    }));

    it('should resolve category ids from categoryNames when recipe has no categoryIds', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_CATEGORY_NAMES));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();

      expect(fixture.componentInstance.selectedCategoryIds()).toEqual(new Set([2, 5]));
    }));

    it('should set empty selectedCategoryIds when recipe has no category data', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();

      expect(fixture.componentInstance.selectedCategoryIds().size).toBe(0);
    }));
  });

  describe('toggleCategory()', () => {
    it('should add a category id when not present', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategory(3);

      expect(fixture.componentInstance.selectedCategoryIds().has(3)).toBeTrue();
    }));

    it('should remove a category id when already present', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_CATEGORIES));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel(); // seed selectedCategoryIds from recipe
      fixture.componentInstance.toggleCategory(2);

      expect(fixture.componentInstance.selectedCategoryIds().has(2)).toBeFalse();
    }));
  });

  describe('saveCategories()', () => {
    it('should call store.updateCategories with correct recipe id and selected ids', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_CATEGORIES));
      mockRecipeRepository.updateCategories.and.returnValue(of({ ...MOCK_RECIPE_WITH_CATEGORIES }));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();
      fixture.componentInstance.saveCategories();
      tick();

      expect(mockRecipeRepository.updateCategories).toHaveBeenCalledOnceWith(1, jasmine.arrayContaining([2, 5]));
    }));

    it('should close the panel and clear savingCategory on success', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_CATEGORIES));
      mockRecipeRepository.updateCategories.and.returnValue(of({ ...MOCK_RECIPE_WITH_CATEGORIES }));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();
      fixture.componentInstance.saveCategories();
      tick();

      expect(fixture.componentInstance.showCategoryPanel()).toBeFalse();
      expect(fixture.componentInstance.savingCategory()).toBeFalse();
    }));

    it('should clear savingCategory on error without closing the panel', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_CATEGORIES));
      mockRecipeRepository.updateCategories.and.returnValue(throwError(() => new Error('Save failed')));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.toggleCategoryPanel();
      fixture.componentInstance.saveCategories();
      tick();

      expect(fixture.componentInstance.savingCategory()).toBeFalse();
      expect(fixture.componentInstance.showCategoryPanel()).toBeTrue();
    }));

    it('should do nothing when no recipe is loaded', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(throwError(() => new Error('Not found')));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.saveCategories();

      expect(mockRecipeRepository.updateCategories).not.toHaveBeenCalled();
    }));
  });

  describe('openFilePicker()', () => {
    it('should trigger click on the hidden file input', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = spyOn(input, 'click');

      fixture.componentInstance.openFilePicker();

      expect(clickSpy).toHaveBeenCalled();
    }));
  });

  describe('onFileSelected()', () => {
    it('should do nothing when no file is present', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      const event = { target: { files: [] } } as unknown as Event;
      fixture.componentInstance.onFileSelected(event);

      expect(mockRecipeRepository.uploadImage).not.toHaveBeenCalled();
      expect(fixture.componentInstance.uploading()).toBeFalse();
    }));

    it('should set uploading to false and update recipe images after successful upload', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.uploadImage.and.returnValue(of(MOCK_IMAGE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      fixture.componentInstance.onFileSelected(event);
      tick();

      expect(fixture.componentInstance.uploading()).toBeFalse();
      expect(fixture.componentInstance.recipe()?.images?.[0]).toEqual(MOCK_IMAGE);
    }));

    it('should call repository.uploadImage with the correct arguments', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.uploadImage.and.returnValue(of(MOCK_IMAGE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      fixture.componentInstance.onFileSelected(event);

      expect(mockRecipeRepository.uploadImage).toHaveBeenCalledOnceWith(1, mockFile);
    }));

    it('should set uploading to false on upload error', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.uploadImage.and.returnValue(throwError(() => new Error('Upload failed')));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      fixture.componentInstance.onFileSelected(event);
      tick();

      expect(fixture.componentInstance.uploading()).toBeFalse();
    }));
  });
});
