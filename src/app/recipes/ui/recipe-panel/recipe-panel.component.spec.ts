import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { RecipePanelComponent } from './recipe-panel.component';
import { RecipeSummary } from '../../domain/recipe.model';

const BASE_RECIPE: RecipeSummary = {
  id: 1,
  title: 'Paella',
  firstImageUrl: null,
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
    it('should return placeholder when firstImageUrl is null', () => {
      fixture.componentRef.setInput('recipe', BASE_RECIPE);
      expect(fixture.componentInstance.imageUrl()).toBe('images/ingredients-background-010.png');
    });

    it('should return the firstImageUrl when it is set', () => {
      fixture.componentRef.setInput('recipe', { ...BASE_RECIPE, firstImageUrl: '/uploads/paella.jpg' });
      expect(fixture.componentInstance.imageUrl()).toBe('/uploads/paella.jpg');
    });
  });
});
