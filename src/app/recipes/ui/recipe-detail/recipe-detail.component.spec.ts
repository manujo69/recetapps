import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { RecipeDetailComponent } from './recipe-detail.component';
import { RecipeService } from '../../application/recipe.service';
import { RecipeRepository } from '../../domain/recipe.repository';
import { Recipe, RecipeImage } from '../../domain/recipe.model';

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

const MOCK_IMAGE: RecipeImage = {
  id: 10,
  filename: 'paella.jpg',
  url: '/uploads/paella.jpg',
};

const MOCK_RECIPE_WITH_IMAGES: Recipe = {
  ...MOCK_RECIPE,
  images: [MOCK_IMAGE],
};

describe('RecipeDetailComponent', () => {
  let mockRepository: jasmine.SpyObj<RecipeRepository>;

  beforeEach(async () => {
    mockRepository = jasmine.createSpyObj('RecipeRepository', [
      'getAll', 'getById', 'create', 'update', 'delete',
      'getByUser', 'search', 'getByCategory', 'uploadImage',
    ]);

    await TestBed.configureTestingModule({
      imports: [RecipeDetailComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: RecipeRepository, useValue: mockRepository },
        RecipeService,
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with no selected recipe before loading', () => {
    mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance.recipe()).toBeNull();
    expect(fixture.componentInstance.loading()).toBeFalse();
  });

  it('should start with uploading as false', () => {
    mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    expect(fixture.componentInstance.uploading()).toBeFalse();
  });

  it('should load recipe by id from route params', fakeAsync(() => {
    mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.recipe()).toEqual(MOCK_RECIPE);
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.error()).toBeNull();
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockRepository.getById.and.returnValue(throwError(() => new Error('Receta no encontrada')));
    const fixture = TestBed.createComponent(RecipeDetailComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.error()).toBe('Receta no encontrada');
    expect(fixture.componentInstance.loading()).toBeFalse();
    expect(fixture.componentInstance.recipe()).toBeNull();
  }));

  describe('isPlaceholderImage()', () => {
    it('should be true when recipe has no images', fakeAsync(() => {
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.isPlaceholderImage()).toBeTrue();
    }));

    it('should be false when recipe has images', fakeAsync(() => {
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_IMAGES));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.isPlaceholderImage()).toBeFalse();
    }));
  });

  describe('imageUrl()', () => {
    it('should return placeholder image when recipe has no images', fakeAsync(() => {
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.imageUrl()).toBe('images/ingredients-background-010.png');
    }));

    it('should return first image url when recipe has images', fakeAsync(() => {
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE_WITH_IMAGES));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      expect(fixture.componentInstance.imageUrl()).toBe('/uploads/paella.jpg');
    }));
  });

  describe('openFilePicker()', () => {
    it('should trigger click on the hidden file input', fakeAsync(() => {
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
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
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      const event = { target: { files: [] } } as unknown as Event;
      fixture.componentInstance.onFileSelected(event);

      expect(mockRepository.uploadImage).not.toHaveBeenCalled();
      expect(fixture.componentInstance.uploading()).toBeFalse();
    }));

    it('should set uploading to false and update recipe images after successful upload', fakeAsync(() => {
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRepository.uploadImage.and.returnValue(of(MOCK_IMAGE));
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
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRepository.uploadImage.and.returnValue(of(MOCK_IMAGE));
      const fixture = TestBed.createComponent(RecipeDetailComponent);
      fixture.detectChanges();
      tick();

      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = { target: { files: [mockFile] } } as unknown as Event;

      fixture.componentInstance.onFileSelected(event);

      expect(mockRepository.uploadImage).toHaveBeenCalledOnceWith(1, mockFile);
    }));

    it('should set uploading to false on upload error', fakeAsync(() => {
      mockRepository.getById.and.returnValue(of(MOCK_RECIPE));
      mockRepository.uploadImage.and.returnValue(throwError(() => new Error('Upload failed')));
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
