import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RecipeDetailComponent } from './recipe-detail.component';
import { RecipeService } from '../../application/recipe.service';
import { Recipe } from '../../domain/recipe.model';

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

describe('RecipeDetailComponent', () => {
  let mockRecipeService: jasmine.SpyObj<RecipeService>;

  beforeEach(async () => {
    mockRecipeService = jasmine.createSpyObj('RecipeService', ['getById']);

    await TestBed.configureTestingModule({
      imports: [RecipeDetailComponent],
      providers: [
        { provide: RecipeService, useValue: mockRecipeService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    mockRecipeService.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show loading state before data arrives', () => {
    mockRecipeService.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance.loading()).toBeTrue();
  });

  it('should load recipe by id from route params', fakeAsync(() => {
    mockRecipeService.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();
    tick();

    expect(mockRecipeService.getById).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.recipe()).toEqual(MOCK_RECIPE);
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.error()).toBeNull();
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockRecipeService.getById.and.returnValue(throwError(() => new Error('Receta no encontrada')));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.error()).toBe('Receta no encontrada');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.recipe()).toBeNull();
  }));
});
