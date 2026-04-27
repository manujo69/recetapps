import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { RecipeFormComponent } from './recipe-form.component';
import { RecipeStore } from '../../application/recipe.store';
import { RecipeRepository } from '../../domain/recipe.repository';
import { Recipe, RecipeImage } from '../../domain/recipe.model';

const MOCK_RECIPE: Recipe = {
  id: 5,
  title: 'Paella valenciana',
  description: 'Receta tradicional',
  ingredients: 'arroz, azafrán, pollo',
  instructions: 'Sofría el pollo, añada el arroz y el caldo.',
  prepTime: 20,
  cookTime: 40,
  servings: 4,
};

const MOCK_IMAGE_OLD: RecipeImage = { id: 5, filename: 'old.jpg', url: '/uploads/old.jpg' };
const MOCK_IMAGE_NEW: RecipeImage = { id: 33, filename: 'newest.jpg', url: '/uploads/newest.jpg' };

const MOCK_RECIPE_WITH_IMAGES: Recipe = {
  ...MOCK_RECIPE,
  images: [MOCK_IMAGE_OLD, MOCK_IMAGE_NEW],
};

const CREATED_RECIPE: Recipe = { ...MOCK_RECIPE, id: 10 };

describe('RecipeFormComponent', () => {
  let mockRecipeRepository: jasmine.SpyObj<RecipeRepository>;
  let router: Router;

  function setupModule(routeId: string | null) {
    return TestBed.configureTestingModule({
      imports: [RecipeFormComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: RecipeRepository, useValue: mockRecipeRepository },
        RecipeStore,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
        },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    mockRecipeRepository = jasmine.createSpyObj<RecipeRepository>('RecipeRepository', [
      'getAll', 'getById', 'create', 'update', 'delete',
      'getByUser', 'search', 'getByCategory', 'getFavorites', 'uploadImage', 'updateCategories',
    ]);
  });

  // ─── Create mode ──────────────────────────────────────────────────────────

  describe('create mode (no route id)', () => {
    beforeEach(async () => {
      await setupModule(null);
      router = TestBed.inject(Router);
      spyOn(router, 'navigate');
    });

    it('should create the component', () => {
      const fixture = TestBed.createComponent(RecipeFormComponent);
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should not be in edit mode', () => {
      const fixture = TestBed.createComponent(RecipeFormComponent);
      expect(fixture.componentInstance.isEditMode()).toBeFalse();
    });

    it('should start with loading false', () => {
      const fixture = TestBed.createComponent(RecipeFormComponent);
      expect(fixture.componentInstance.loading()).toBeFalse();
    });

    it('should start with an empty form', () => {
      const fixture = TestBed.createComponent(RecipeFormComponent);
      const { title, description, prepTime, cookTime, servings, ingredients, instructions } =
        fixture.componentInstance.form.getRawValue();
      expect(title).toBe('');
      expect(description).toBe('');
      expect(prepTime).toBe(0);
      expect(cookTime).toBe(0);
      expect(servings).toBe(1);
      expect(ingredients).toBe('');
      expect(instructions).toBe('');
    });

    it('should show placeholder image when no file is selected', () => {
      const fixture = TestBed.createComponent(RecipeFormComponent);
      expect(fixture.componentInstance.imageUrl()).toBe('images/ingredients-background-010.png');
    });

    it('should call store.create() with form values on submit', fakeAsync(() => {
      mockRecipeRepository.create.and.returnValue(of(CREATED_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.componentInstance.form.setValue({
        title: 'Nueva receta',
        description: 'Descripción',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        ingredients: 'ingredientes',
        instructions: 'instrucciones',
      });

      fixture.componentInstance.onSubmit();
      tick();

      expect(mockRecipeRepository.create).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ title: 'Nueva receta', prepTime: 10, cookTime: 20, servings: 2 }),
      );
    }));

    it('should navigate to the created recipe detail on success', fakeAsync(() => {
      mockRecipeRepository.create.and.returnValue(of(CREATED_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.componentInstance.form.setValue({
        title: 'Nueva receta',
        description: '',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        ingredients: 'ingredientes',
        instructions: 'instrucciones',
      });

      fixture.componentInstance.onSubmit();
      tick();

      expect(router.navigate).toHaveBeenCalledOnceWith(['/recipes', CREATED_RECIPE.id]);
    }));

    it('should upload image after create and then navigate', fakeAsync(() => {
      mockRecipeRepository.create.and.returnValue(of(CREATED_RECIPE));
      mockRecipeRepository.uploadImage.and.returnValue(of(MOCK_IMAGE_NEW));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.componentInstance.form.setValue({
        title: 'Nueva receta',
        description: '',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        ingredients: 'ingredientes',
        instructions: 'instrucciones',
      });
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      fixture.componentInstance.onFileSelected(file);

      fixture.componentInstance.onSubmit();
      tick();

      expect(mockRecipeRepository.uploadImage).toHaveBeenCalledOnceWith(CREATED_RECIPE.id!, file);
      expect(router.navigate).toHaveBeenCalledWith(['/recipes', CREATED_RECIPE.id]);
    }));

    it('should set error and clear submitting on create failure', fakeAsync(() => {
      mockRecipeRepository.create.and.returnValue(throwError(() => new Error('Error al crear')));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.componentInstance.form.setValue({
        title: 'Nueva receta',
        description: '',
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        ingredients: 'ingredientes',
        instructions: 'instrucciones',
      });

      fixture.componentInstance.onSubmit();
      tick();

      expect(fixture.componentInstance.error()).toBe('Error al crear');
      expect(fixture.componentInstance.submitting()).toBeFalse();
    }));

    it('should not submit when form is invalid', fakeAsync(() => {
      const fixture = TestBed.createComponent(RecipeFormComponent);
      // title required but empty by default
      fixture.componentInstance.onSubmit();
      tick();

      expect(mockRecipeRepository.create).not.toHaveBeenCalled();
    }));
  });

  // ─── Edit mode ────────────────────────────────────────────────────────────

  describe('edit mode (route id = 5)', () => {
    beforeEach(async () => {
      await setupModule('5');
      router = TestBed.inject(Router);
      spyOn(router, 'navigate');
    });

    it('should be in edit mode', () => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      expect(fixture.componentInstance.isEditMode()).toBeTrue();
    });

    it('should start with loading true while the recipe is being fetched', () => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      // Before tick(), effect has not yet run
      expect(fixture.componentInstance.loading()).toBeTrue();
    });

    it('should call store.loadById with the route id', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      TestBed.createComponent(RecipeFormComponent);
      tick();

      expect(mockRecipeRepository.getById).toHaveBeenCalledOnceWith(5);
    }));

    it('should populate the form with the loaded recipe', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      const { title, description, prepTime, cookTime, servings, ingredients, instructions } =
        fixture.componentInstance.form.getRawValue();
      expect(title).toBe(MOCK_RECIPE.title);
      expect(description).toBe(MOCK_RECIPE.description ?? '');
      expect(prepTime).toBe(MOCK_RECIPE.prepTime);
      expect(cookTime).toBe(MOCK_RECIPE.cookTime);
      expect(servings).toBe(MOCK_RECIPE.servings);
      expect(ingredients).toBe(MOCK_RECIPE.ingredients);
      expect(instructions).toBe(MOCK_RECIPE.instructions);
    }));

    it('should set loading to false after the form is populated', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.loading()).toBeFalse();
    }));

    it('should set existingImageUrl to the image with the highest id', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_IMAGES));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.existingImageUrl()).toBe(MOCK_IMAGE_NEW.url);
    }));

    it('should show the existing image when no new file is selected', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_IMAGES));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.imageUrl()).toBe(MOCK_IMAGE_NEW.url);
    }));

    it('should call store.update() with the recipe id and form values on submit', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.update.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.onSubmit();
      tick();

      expect(mockRecipeRepository.update).toHaveBeenCalledOnceWith(
        5,
        jasmine.objectContaining({ title: MOCK_RECIPE.title }),
      );
    }));

    it('should navigate to the recipe detail with replaceUrl after update', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.update.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.onSubmit();
      tick();

      expect(router.navigate).toHaveBeenCalledOnceWith(['/recipes', 5], { replaceUrl: true });
    }));

    it('should upload image after update and navigate with replaceUrl', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.update.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.uploadImage.and.returnValue(of(MOCK_IMAGE_NEW));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      fixture.componentInstance.onFileSelected(file);
      fixture.componentInstance.onSubmit();
      tick();

      expect(mockRecipeRepository.uploadImage).toHaveBeenCalledOnceWith(5, file);
      expect(router.navigate).toHaveBeenCalledWith(['/recipes', 5], { replaceUrl: true });
    }));

    it('should set error and clear submitting on update failure', fakeAsync(() => {
      mockRecipeRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRecipeRepository.update.and.returnValue(throwError(() => new Error('Error al guardar')));
      const fixture = TestBed.createComponent(RecipeFormComponent);
      fixture.detectChanges();
      tick();

      fixture.componentInstance.onSubmit();
      tick();

      expect(fixture.componentInstance.error()).toBe('Error al guardar');
      expect(fixture.componentInstance.submitting()).toBeFalse();
    }));
  });

  // ─── Image selection (shared) ─────────────────────────────────────────────

  describe('onFileSelected()', () => {
    beforeEach(async () => {
      await setupModule(null);
    });

    it('should set selectedImage and update imageUrl with a preview', () => {
      const fixture = TestBed.createComponent(RecipeFormComponent);
      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      fixture.componentInstance.onFileSelected(file);

      expect(fixture.componentInstance.selectedImage()).toBe(file);
      expect(fixture.componentInstance.imageUrl()).toMatch(/^blob:/);
    });
  });
});
