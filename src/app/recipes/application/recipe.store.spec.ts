import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecipeStore } from './recipe.store';
import { RecipeRepository } from '../domain/recipe.repository';
import { Recipe, RecipeImage } from '../domain/recipe.model';

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

const MOCK_IMAGE: RecipeImage = {
  id: 10,
  filename: 'paella.jpg',
  url: '/uploads/paella.jpg',
};

describe('RecipeStore', () => {
  let store: InstanceType<typeof RecipeStore>;
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
      providers: [RecipeStore, { provide: RecipeRepository, useValue: repositorySpy }],
    });

    store = TestBed.inject(RecipeStore);
  });

  // ─── Initial state ────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should have an empty recipes list', () => {
      expect(store.recipes()).toEqual([]);
    });

    it('should have no selected recipe', () => {
      expect(store.selectedRecipe()).toBeNull();
    });

    it('should not be loaded', () => {
      expect(store.loaded()).toBeFalse();
    });

    it('should not be loading', () => {
      expect(store.loading()).toBeFalse();
    });

    it('should have no error', () => {
      expect(store.error()).toBeNull();
    });
  });

  // ─── loadAll() ────────────────────────────────────────────────────────────

  describe('loadAll()', () => {
    it('should populate recipes and mark as loaded on success', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_1, RECIPE_2]));

      store.loadAll();
      tick();

      expect(store.recipes()).toEqual([RECIPE_1, RECIPE_2]);
      expect(store.loaded()).toBeTrue();
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
    }));

    it('should skip the HTTP call when data is already loaded', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_1]));
      store.loadAll();
      tick();

      repositorySpy.getAll.calls.reset();
      store.loadAll();
      tick();

      expect(repositorySpy.getAll).not.toHaveBeenCalled();
    }));

    it('should set error and stop loading on failure', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(throwError(() => new Error('Error de red')));

      store.loadAll();
      tick();

      expect(store.error()).toBe('Error de red');
      expect(store.loading()).toBeFalse();
      expect(store.recipes()).toEqual([]);
    }));

    it('should use a fallback error message when the error has no message', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(throwError(() => ({})));

      store.loadAll();
      tick();

      expect(store.error()).toBe('Error al cargar recetas');
    }));
  });

  // ─── loadById() ───────────────────────────────────────────────────────────

  describe('loadById()', () => {
    it('should set selectedRecipe on success', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));

      store.loadById(1);
      tick();

      expect(store.selectedRecipe()).toEqual(RECIPE_1);
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
    }));

    it('should use the cached recipe and skip the HTTP call when already in the list', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_1, RECIPE_2]));
      store.loadAll();
      tick();

      store.loadById(1);
      tick();

      expect(repositorySpy.getById).not.toHaveBeenCalled();
      expect(store.selectedRecipe()).toEqual(RECIPE_1);
    }));

    it('should set error and stop loading on failure', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(throwError(() => new Error('Receta no encontrada')));

      store.loadById(99);
      tick();

      expect(store.error()).toBe('Receta no encontrada');
      expect(store.loading()).toBeFalse();
      expect(store.selectedRecipe()).toBeNull();
    }));

    it('should use a fallback error message when the error has no message', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(throwError(() => ({})));

      store.loadById(99);
      tick();

      expect(store.error()).toBe('Receta no encontrada');
    }));
  });

  // ─── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('should set selectedRecipe and invalidate the list cache on success', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_1]));
      store.loadAll();
      tick();
      expect(store.loaded()).toBeTrue();

      repositorySpy.create.and.returnValue(of(RECIPE_2));
      store.create(RECIPE_2).subscribe();
      tick();

      expect(store.selectedRecipe()).toEqual(RECIPE_2);
      expect(store.loaded()).toBeFalse();
      expect(store.loading()).toBeFalse();
    }));

    it('should set error, stop loading and rethrow the error on failure', fakeAsync(() => {
      const error = new Error('Error al crear');
      repositorySpy.create.and.returnValue(throwError(() => error));
      let caughtError: unknown;

      store.create(RECIPE_1).subscribe({ error: (e) => (caughtError = e) });
      tick();

      expect(store.error()).toBe('Error al crear');
      expect(store.loading()).toBeFalse();
      expect(caughtError).toBe(error);
    }));

    it('should use a fallback error message when the error has no message', fakeAsync(() => {
      repositorySpy.create.and.returnValue(throwError(() => ({})));

      store.create(RECIPE_1).subscribe({ error: () => {} });
      tick();

      expect(store.error()).toBe('Error al crear receta');
    }));
  });

  // ─── uploadImage() ────────────────────────────────────────────────────────

  describe('uploadImage()', () => {
    it('should prepend the uploaded image to selectedRecipe.images on success', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      repositorySpy.uploadImage.and.returnValue(of(MOCK_IMAGE));
      store.uploadImage(1, new File([''], 'test.jpg', { type: 'image/jpeg' })).subscribe();
      tick();

      expect(store.selectedRecipe()?.images?.[0]).toEqual(MOCK_IMAGE);
      expect(store.loading()).toBeFalse();
    }));

    it('should stop loading and rethrow the error on failure', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      const error = new Error('Upload failed');
      repositorySpy.uploadImage.and.returnValue(throwError(() => error));
      let caughtError: unknown;

      store
        .uploadImage(1, new File([''], 'test.jpg', { type: 'image/jpeg' }))
        .subscribe({ error: (e) => (caughtError = e) });
      tick();

      expect(store.loading()).toBeFalse();
      expect(caughtError).toBe(error);
    }));

    it('should stop loading even when selectedRecipe is null at upload completion', fakeAsync(() => {
      repositorySpy.uploadImage.and.returnValue(of(MOCK_IMAGE));

      store.uploadImage(1, new File([''], 'test.jpg', { type: 'image/jpeg' })).subscribe();
      tick();

      expect(store.selectedRecipe()).toBeNull();
      expect(store.loading()).toBeFalse();
    }));
  });

  // ─── clearSelected() ──────────────────────────────────────────────────────

  describe('clearSelected()', () => {
    it('should set selectedRecipe to null', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      store.clearSelected();

      expect(store.selectedRecipe()).toBeNull();
    }));
  });
});
