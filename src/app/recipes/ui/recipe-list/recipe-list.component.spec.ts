import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecipeListComponent } from './recipe-list.component';
import { RecipeService } from '../../application/recipe.service';
import { Recipe } from '../../domain/recipe.model';

const MOCK_RECIPES: Recipe[] = [
  { id: 1, title: 'Paella', ingredients: 'arroz', instructions: 'cocer', prepTime: 20, cookTime: 40, servings: 4 },
  { id: 2, title: 'Tortilla', ingredients: 'huevos', instructions: 'batir', prepTime: 5, cookTime: 10, servings: 2 },
];

describe('RecipeListComponent', () => {
  let mockRecipeService: jasmine.SpyObj<RecipeService>;

  beforeEach(async () => {
    mockRecipeService = jasmine.createSpyObj('RecipeService', ['getAll']);

    await TestBed.configureTestingModule({
      imports: [RecipeListComponent],
      providers: [
        provideRouter([]),
        { provide: RecipeService, useValue: mockRecipeService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    mockRecipeService.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(RecipeListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading state before data arrives', () => {
    mockRecipeService.getAll.and.returnValue(of([]));
    const fixture = TestBed.createComponent(RecipeListComponent);
    expect(fixture.componentInstance.loading()).toBeTrue();
  });

  it('should populate recipes and stop loading on success', fakeAsync(() => {
    mockRecipeService.getAll.and.returnValue(of(MOCK_RECIPES));
    const fixture = TestBed.createComponent(RecipeListComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.recipes()).toEqual(MOCK_RECIPES);
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.error()).toBeNull();
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockRecipeService.getAll.and.returnValue(throwError(() => new Error('Error al cargar las recetas')));
    const fixture = TestBed.createComponent(RecipeListComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.error()).toBe('Error al cargar las recetas');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.recipes()).toEqual([]);
  }));
});
