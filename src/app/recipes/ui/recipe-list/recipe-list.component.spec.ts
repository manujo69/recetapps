import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { RecipeListComponent } from './recipe-list.component';
import { RecipeStore } from '../../application/recipe.store';
import { RecipeRepository } from '../../domain/recipe.repository';
import { Recipe } from '../../domain/recipe.model';

const MOCK_RECIPES: Recipe[] = [
  { id: 1, title: 'Paella', ingredients: 'arroz', instructions: 'cocer', prepTime: 20, cookTime: 40, servings: 4 },
  { id: 2, title: 'Tortilla', ingredients: 'huevos', instructions: 'batir', prepTime: 5, cookTime: 10, servings: 2 },
];

describe('RecipeListComponent', () => {
  let mockRepository: jasmine.SpyObj<RecipeRepository>;

  beforeEach(async () => {
    mockRepository = jasmine.createSpyObj('RecipeRepository', [
      'getAll', 'getById', 'create', 'update', 'delete',
      'getByUser', 'search', 'getByCategory', 'uploadImage',
    ]);

    await TestBed.configureTestingModule({
      imports: [RecipeListComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: RecipeRepository, useValue: mockRepository },
        RecipeStore,
      ],
    }).compileComponents();
  });

  it('should create', () => {
    mockRepository.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(RecipeListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with empty state before data loads', () => {
    mockRepository.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(RecipeListComponent);
    expect(fixture.componentInstance.recipes()).toEqual([]);
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('should populate recipes and stop loading on success', fakeAsync(() => {
    mockRepository.getAll.and.returnValue(of(MOCK_RECIPES));
    const fixture = TestBed.createComponent(RecipeListComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.recipes()).toEqual(MOCK_RECIPES);
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.error()).toBeNull();
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockRepository.getAll.and.returnValue(throwError(() => new Error('Error al cargar las recetas')));
    const fixture = TestBed.createComponent(RecipeListComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.error()).toBe('Error al cargar las recetas');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.recipes()).toEqual([]);
  }));
});
