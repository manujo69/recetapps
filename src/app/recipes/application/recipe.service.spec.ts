import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecipeService } from './recipe.service';
import { RecipeRepository } from '../domain/recipe.repository';
import { Recipe, RecipeImage, RecipeSummary } from '../domain/recipe.model';

const RECIPE_1: Recipe = {
  id: 1,
  title: 'Paella',
  ingredients: 'arroz, azafrán',
  instructions: 'Sofría y añada el arroz',
  prepTime: 20,
  cookTime: 40,
  servings: 4,
};

const RECIPE_2: Recipe = {
  id: 2,
  title: 'Tortilla',
  ingredients: 'huevos, patatas',
  instructions: 'Bata los huevos',
  prepTime: 10,
  cookTime: 15,
  servings: 2,
};

const RECIPE_LIST: RecipeSummary[] = [{
  id: 1,
  title: 'Paella',
  firstImageUrl: null,
  prepTime: 20,
  cookTime: 40,
  servings: 4,
},
{
  id: 2,
  title: 'Tortilla',
  firstImageUrl: null,
  prepTime: 10,
  cookTime: 15,
  servings: 2,
}];

const SUMMARY_1: RecipeSummary = { id: 1, title: 'Paella', firstImageUrl: null, prepTime: 20, cookTime: 40, servings: 4 };
const SUMMARY_2: RecipeSummary = { id: 2, title: 'Tortilla', firstImageUrl: null, prepTime: 10, cookTime: 15, servings: 2 };

const MOCK_IMAGE: RecipeImage = {
  id: 10,
  filename: 'paella.jpg',
  url: '/uploads/paella.jpg',
};

describe('RecipeService', () => {
  let service: RecipeService;
  let repositorySpy: jasmine.SpyObj<RecipeRepository>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<RecipeRepository>('RecipeRepository', [
      'getAll',
      'getById',
      'create',
      'update',
      'delete',
      'getByUser',
      'search',
      'getByCategory',
      'uploadImage',
    ]);

    TestBed.configureTestingModule({
      providers: [RecipeService, { provide: RecipeRepository, useValue: repositorySpy }],
    });

    service = TestBed.inject(RecipeService);
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have an empty recipes list', () => {
      expect(service.recipes()).toEqual([]);
    });

    it('should have no selected recipe', () => {
      expect(service.selectedRecipe()).toBeNull();
    });

    it('should not be loaded', () => {
      expect(service.loaded()).toBeFalse();
    });

    it('should not be loading', () => {
      expect(service.loading()).toBeFalse();
    });

    it('should have no error', () => {
      expect(service.error()).toBeNull();
    });
  });

  // ─── loadAll() ────────────────────────────────────────────────────────────

  describe('loadAll()', () => {
    it('should populate recipes and mark as loaded on success', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([SUMMARY_1, SUMMARY_2]));

      service.loadAll();
      tick();

      expect(service.recipes()).toEqual([SUMMARY_1, SUMMARY_2]);
      expect(service.loaded()).toBeTrue();
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    }));

    it('should skip the HTTP call when data is already loaded', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([SUMMARY_1]));
      service.loadAll();
      tick();

      repositorySpy.getAll.calls.reset();
      service.loadAll();
      tick();

      expect(repositorySpy.getAll).not.toHaveBeenCalled();
    }));

    it('should set error and stop loading on failure', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(throwError(() => new Error('Error de red')));

      service.loadAll();
      tick();

      expect(service.error()).toBe('Error de red');
      expect(service.loading()).toBeFalse();
      expect(service.recipes()).toEqual([]);
    }));

    it('should use a fallback error message when the error has no message', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(throwError(() => ({})));

      service.loadAll();
      tick();

      expect(service.error()).toBe('Error al cargar recetas');
    }));
  });

  // ─── loadById() ───────────────────────────────────────────────────────────

  describe('loadById()', () => {
    it('should set selectedRecipe on success', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));

      service.loadById(1);
      tick();

      expect(service.selectedRecipe()).toEqual(RECIPE_1);
      expect(service.loading()).toBeFalse();
      expect(service.error()).toBeNull();
    }));

    it('should use the cached recipe and skip the HTTP call on a second loadById with the same id', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));

      service.loadById(1);
      tick();
      service.loadById(1);
      tick();

      expect(repositorySpy.getById).toHaveBeenCalledTimes(1);
      expect(service.selectedRecipe()).toEqual(RECIPE_1);
    }));

    it('should set error and stop loading on failure', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(throwError(() => new Error('Receta no encontrada')));

      service.loadById(99);
      tick();

      expect(service.error()).toBe('Receta no encontrada');
      expect(service.loading()).toBeFalse();
      expect(service.selectedRecipe()).toBeNull();
    }));

    it('should use a fallback error message when the error has no message', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(throwError(() => ({})));

      service.loadById(99);
      tick();

      expect(service.error()).toBe('Receta no encontrada');
    }));
  });

  // ─── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should set selectedRecipe and invalidate the list cache on success', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of(RECIPE_LIST));
      service.loadAll();
      tick();
      expect(service.loaded()).toBeTrue();

      repositorySpy.create.and.returnValue(of(RECIPE_2));
      service.create(RECIPE_2).subscribe();
      tick();

      expect(service.selectedRecipe()).toEqual(RECIPE_2);
      expect(service.loaded()).toBeFalse();
      expect(service.loading()).toBeFalse();
    }));

    it('should set error, stop loading and rethrow the error on failure', fakeAsync(() => {
      const error = new Error('Error al crear');
      repositorySpy.create.and.returnValue(throwError(() => error));
      let caughtError: unknown;

      service.create(RECIPE_1).subscribe({ error: (e) => (caughtError = e) });
      tick();

      expect(service.error()).toBe('Error al crear');
      expect(service.loading()).toBeFalse();
      expect(caughtError).toBe(error);
    }));

    it('should use a fallback error message when the error has no message', fakeAsync(() => {
      repositorySpy.create.and.returnValue(throwError(() => ({})));

      service.create(RECIPE_1).subscribe({ error: () => { console.log('Error al crear receta'); } });
      tick();

      expect(service.error()).toBe('Error al crear receta');
    }));
  });

  // ─── uploadImage() ────────────────────────────────────────────────────────

  describe('uploadImage()', () => {
    it('should prepend the uploaded image to selectedRecipe.images on success', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      service.loadById(1);
      tick();

      repositorySpy.uploadImage.and.returnValue(of(MOCK_IMAGE));
      service.uploadImage(1, new File([''], 'test.jpg', { type: 'image/jpeg' })).subscribe();
      tick();

      expect(service.selectedRecipe()?.images?.[0]).toEqual(MOCK_IMAGE);
      expect(service.loading()).toBeFalse();
    }));

    it('should stop loading and rethrow the error on failure', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      service.loadById(1);
      tick();

      const error = new Error('Upload failed');
      repositorySpy.uploadImage.and.returnValue(throwError(() => error));
      let caughtError: unknown;

      service
        .uploadImage(1, new File([''], 'test.jpg', { type: 'image/jpeg' }))
        .subscribe({ error: (e) => (caughtError = e) });
      tick();

      expect(service.loading()).toBeFalse();
      expect(caughtError).toBe(error);
    }));

    it('should stop loading even when selectedRecipe is null at upload completion', fakeAsync(() => {
      repositorySpy.uploadImage.and.returnValue(of(MOCK_IMAGE));

      service.uploadImage(1, new File([''], 'test.jpg', { type: 'image/jpeg' })).subscribe();
      tick();

      expect(service.selectedRecipe()).toBeNull();
      expect(service.loading()).toBeFalse();
    }));
  });

  // ─── clearSelected() ──────────────────────────────────────────────────────

  describe('clearSelected()', () => {
    it('should set selectedRecipe to null', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      service.loadById(1);
      tick();

      service.clearSelected();

      expect(service.selectedRecipe()).toBeNull();
    }));
  });
});
