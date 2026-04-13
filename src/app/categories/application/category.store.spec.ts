import { of, throwError } from "rxjs";
import { Category } from "../domain/category.model";
import { CategoryStore } from "./category.store";
import { CategoryRepository } from "../domain/category.repository";
import { fakeAsync, TestBed, tick } from "@angular/core/testing";

const CATEGORY_1: Category = { id: 1, name: 'Category 1' };

describe('CategoryStore', () => {
  let store: InstanceType<typeof CategoryStore>;
  let repositorySpy: jasmine.SpyObj<CategoryRepository>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj('CategoryRepository', ['getAll', 'create']);

    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryRepository, useValue: repositorySpy },
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
});
