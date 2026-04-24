import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecipeStore } from './recipe.store';
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

const RECIPE_SUMMARY_1: RecipeSummary = {
  id: 1,
  title: 'Paella',
  firstImageUrl: null,
  prepTime: 20,
  cookTime: 40,
  servings: 4,
};

const RECIPE_SUMMARY_2: RecipeSummary = {
  id: 2,
  title: 'Tortilla',
  firstImageUrl: null,
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
      'getFavorites',
      'uploadImage',
      'updateCategories',
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
      repositorySpy.getAll.and.returnValue(of([RECIPE_SUMMARY_1, RECIPE_SUMMARY_2]));

      store.loadAll();
      tick();

      expect(store.recipes()).toEqual([RECIPE_SUMMARY_1, RECIPE_SUMMARY_2]);
      expect(store.loaded()).toBeTrue();
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
    }));

    it('should skip the HTTP call when data is already loaded', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_SUMMARY_1]));
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

    it('should use the cached recipe and skip the HTTP call on a second loadById call', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      repositorySpy.getById.calls.reset();
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
      repositorySpy.getAll.and.returnValue(of([RECIPE_SUMMARY_1]));
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

      store.create(RECIPE_1).subscribe({ error: () => { console.log('Error al crear receta'); } });
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

  // ─── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('should update selectedRecipe on success', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      const updated = { ...RECIPE_1, title: 'Paella actualizada' };
      repositorySpy.update.and.returnValue(of(updated));
      store.update(1, updated).subscribe();
      tick();

      expect(store.selectedRecipe()).toEqual(updated);
    }));

    it('should use the updated recipe from cache on next loadById', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      const updated = { ...RECIPE_1, title: 'Paella actualizada' };
      repositorySpy.update.and.returnValue(of(updated));
      store.update(1, updated).subscribe();
      tick();

      repositorySpy.getById.calls.reset();
      store.loadById(1);
      tick();

      expect(repositorySpy.getById).not.toHaveBeenCalled();
      expect(store.selectedRecipe()).toEqual(updated);
    }));

    it('should rethrow the error on failure', fakeAsync(() => {
      const error = new Error('Error al actualizar');
      repositorySpy.update.and.returnValue(throwError(() => error));
      let caughtError: unknown;

      store.update(1, RECIPE_1).subscribe({ error: (e) => (caughtError = e) });
      tick();

      expect(caughtError).toBe(error);
    }));
  });

  // ─── updateCategories() ───────────────────────────────────────────────────

  describe('updateCategories()', () => {
    it('should update selectedRecipe and the recipes list on success', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_SUMMARY_1, RECIPE_SUMMARY_2]));
      store.loadAll();
      tick();

      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      const updated = { ...RECIPE_1, categoryIds: [3, 7] };
      repositorySpy.updateCategories.and.returnValue(of(updated));
      store.updateCategories(1, [3, 7]).subscribe();
      tick();

      expect(store.selectedRecipe()).toEqual(updated);
      const summary = store.recipes().find((r) => r.id === 1);
      expect(summary?.categoryIds).toEqual([3, 7]);
    }));

    it('should rethrow the error on failure', fakeAsync(() => {
      const error = new Error('Error al actualizar categorías');
      repositorySpy.updateCategories.and.returnValue(throwError(() => error));
      let caughtError: unknown;

      store.updateCategories(1, [3]).subscribe({ error: (e) => (caughtError = e) });
      tick();

      expect(caughtError).toBe(error);
    }));
  });

  // ─── delete() ─────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('should clear selectedRecipe and remove the recipe from the list on success', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_SUMMARY_1, RECIPE_SUMMARY_2]));
      store.loadAll();
      tick();

      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      repositorySpy.delete.and.returnValue(of(undefined));
      store.delete(1).subscribe();
      tick();

      expect(store.selectedRecipe()).toBeNull();
      expect(store.recipes().find((r) => r.id === 1)).toBeUndefined();
      expect(store.recipes().length).toBe(1);
    }));

    it('should invalidate the list cache (loaded = false) on success', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_SUMMARY_1]));
      store.loadAll();
      tick();
      expect(store.loaded()).toBeTrue();

      repositorySpy.delete.and.returnValue(of(undefined));
      store.delete(1).subscribe();
      tick();

      expect(store.loaded()).toBeFalse();
    }));

    it('should remove the recipe from cache so next loadById hits the repository', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      repositorySpy.delete.and.returnValue(of(undefined));
      store.delete(1).subscribe();
      tick();

      repositorySpy.getById.calls.reset();
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      expect(repositorySpy.getById).toHaveBeenCalledOnceWith(1);
    }));

    it('should rethrow the error on failure', fakeAsync(() => {
      const error = new Error('Error al eliminar');
      repositorySpy.delete.and.returnValue(throwError(() => error));
      let caughtError: unknown;

      store.delete(1).subscribe({ error: (e) => (caughtError = e) });
      tick();

      expect(caughtError).toBe(error);
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

  // ─── reset() ──────────────────────────────────────────────────────────────

  describe('reset()', () => {
    it('should restore the initial state', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(of([RECIPE_SUMMARY_1]));
      store.loadAll();
      tick();

      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      store.reset();

      expect(store.recipes()).toEqual([]);
      expect(store.selectedRecipe()).toBeNull();
      expect(store.loaded()).toBeFalse();
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
    }));

    it('should clear the recipe cache so next loadById hits the repository', fakeAsync(() => {
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      store.reset();

      repositorySpy.getById.calls.reset();
      repositorySpy.getById.and.returnValue(of(RECIPE_1));
      store.loadById(1);
      tick();

      expect(repositorySpy.getById).toHaveBeenCalledOnceWith(1);
    }));
  });
});
