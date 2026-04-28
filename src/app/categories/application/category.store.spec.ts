import { of, throwError } from "rxjs";
import { Category } from "../domain/category.model";
import { CategoryStore } from "./category.store";
import { CategoryRepository } from "../domain/category.repository";
import { RecipeStore } from "../../recipes/application/recipe.store";
import { SyncService } from "../../sync/application/sync.service";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";

const CATEGORY_1: Category = { id: 1, name: 'Category 1' };
const CATEGORY_2: Category = { id: 2, name: 'Category 2' };

describe('CategoryStore', () => {
  let store: InstanceType<typeof CategoryStore>;
  let repositorySpy: jasmine.SpyObj<CategoryRepository>;
  let recipeStoreSpy: jasmine.SpyObj<InstanceType<typeof RecipeStore>>;
  let syncServiceSpy: jasmine.SpyObj<SyncService>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj('CategoryRepository', ['getAll', 'create', 'delete']);
    recipeStoreSpy = jasmine.createSpyObj('RecipeStore', ['removeCategoryFromAll']);
    syncServiceSpy = jasmine.createSpyObj('SyncService', ['push']);
    syncServiceSpy.push.and.returnValue(Promise.resolve());

    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryRepository, useValue: repositorySpy },
        { provide: RecipeStore, useValue: recipeStoreSpy },
        { provide: SyncService, useValue: syncServiceSpy },
        CategoryStore,
      ],
    });

    store = TestBed.inject(CategoryStore);
  });

  it('should load categories successfully', (done) => {
    repositorySpy.getAll.and.returnValue(of([CATEGORY_1]));

    store.loadAll();

    setTimeout(() => {
      expect(store.categories()).toEqual([CATEGORY_1]);
      expect(store.loaded()).toBeTrue();
      expect(store.loading()).toBeFalse();
      expect(store.error()).toBeNull();
      done();
    });
  });

  it('should set error and stop loading on failure', fakeAsync(() => {
      repositorySpy.getAll.and.returnValue(throwError(() => new Error('Error de red')));

      store.loadAll();
      tick();

      expect(store.error()).toBe('Error de red');
      expect(store.loading()).toBeFalse();
      expect(store.categories()).toEqual([]);
    }));

  it('should create a category successfully', (done) => {
    const newCategory: Category = { id: 2, name: 'Category 2' };
    repositorySpy.create.and.returnValue(of(newCategory));

    store.create(newCategory).subscribe((created) => {
      expect(created).toEqual(newCategory);
      expect(store.categories()).toEqual([newCategory]);
      done();
    });
  });

  it('should not call the repository again when already loaded', fakeAsync(() => {
    repositorySpy.getAll.and.returnValue(of([CATEGORY_1]));

    store.loadAll();
    tick();

    store.loadAll();

    expect(repositorySpy.getAll).toHaveBeenCalledTimes(1);
  }));

  it('should use the fallback message when the error has no message', fakeAsync(() => {
    repositorySpy.getAll.and.returnValue(throwError(() => ({})));

    store.loadAll();
    tick();

    expect(store.error()).toBe('Error al cargar categorías');
    expect(store.loading()).toBeFalse();
  }));

  it('should propagate the error when create fails', (done) => {
    const error = new Error('Create failed');
    repositorySpy.create.and.returnValue(throwError(() => error));

    store.create({ name: 'New Category' }).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });

  // ─── delete() ─────────────────────────────────────────────────────────────

  it('should remove the deleted category from the store on success', fakeAsync(() => {
    repositorySpy.getAll.and.returnValue(of([CATEGORY_1, CATEGORY_2]));
    store.loadAll();
    tick();

    repositorySpy.delete.and.returnValue(of(undefined));
    store.delete(1).subscribe();
    tick();

    expect(store.categories()).toEqual([CATEGORY_2]);
  }));

  it('should call recipeStore.removeCategoryFromAll with the deleted id on success', fakeAsync(() => {
    repositorySpy.getAll.and.returnValue(of([CATEGORY_1]));
    store.loadAll();
    tick();

    repositorySpy.delete.and.returnValue(of(undefined));
    store.delete(1).subscribe();
    tick();

    expect(recipeStoreSpy.removeCategoryFromAll).toHaveBeenCalledOnceWith(1);
  }));

  it('should propagate the error and leave the store unchanged when delete fails', fakeAsync(() => {
    repositorySpy.getAll.and.returnValue(of([CATEGORY_1, CATEGORY_2]));
    store.loadAll();
    tick();

    const error = new Error('Delete failed');
    repositorySpy.delete.and.returnValue(throwError(() => error));
    let caughtError: unknown;

    store.delete(1).subscribe({ error: (err) => (caughtError = err) });
    tick();

    expect(caughtError).toBe(error);
    expect(store.categories()).toEqual([CATEGORY_1, CATEGORY_2]);
    expect(recipeStoreSpy.removeCategoryFromAll).not.toHaveBeenCalled();
  }));
});
