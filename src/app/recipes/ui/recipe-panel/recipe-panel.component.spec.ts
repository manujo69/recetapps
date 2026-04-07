import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RecipePanelComponent } from './recipe-panel.component';
import { Recipe } from '../../domain/recipe.model';

const BASE_RECIPE: Recipe = {
  id: 1,
  title: 'Paella',
  ingredients: 'arroz',
  instructions: 'Sofría el arroz',
  prepTime: 20,
  cookTime: 40,
  servings: 4,
};

describe('RecipePanelComponent', () => {
  let fixture: ComponentFixture<RecipePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipePanelComponent],
      providers: [provideRouter([]), provideTranslateService({ lang: 'es' })],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipePanelComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('recipe', BASE_RECIPE);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('imageUrl()', () => {
    it('should return placeholder when recipe has no images property', () => {
      fixture.componentRef.setInput('recipe', BASE_RECIPE);
      expect(fixture.componentInstance.imageUrl()).toBe('images/ingredients-background-010.png');
    });

    it('should return placeholder when recipe has an empty images array', () => {
      fixture.componentRef.setInput('recipe', { ...BASE_RECIPE, images: [] });
      expect(fixture.componentInstance.imageUrl()).toBe('images/ingredients-background-010.png');
    });

    it('should return the first image url when recipe has images', () => {
      const recipe: Recipe = {
        ...BASE_RECIPE,
        images: [{ id: 10, filename: 'paella.jpg', url: '/uploads/paella.jpg' }],
      };
      fixture.componentRef.setInput('recipe', recipe);
      expect(fixture.componentInstance.imageUrl()).toBe('/uploads/paella.jpg');
    });
  });
});
