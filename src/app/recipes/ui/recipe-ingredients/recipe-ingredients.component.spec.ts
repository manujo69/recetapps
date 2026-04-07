import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RecipeIngredientsComponent } from './recipe-ingredients.component';

describe('RecipeIngredientsComponent', () => {
  let fixture: ComponentFixture<RecipeIngredientsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeIngredientsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeIngredientsComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('ingredients', 'arroz');
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('items()', () => {
    it('should split by comma and trim each item', () => {
      fixture.componentRef.setInput('ingredients', 'arroz, patatas, aceite');
      expect(fixture.componentInstance.items()).toEqual(['Arroz', 'Patatas', 'Aceite']);
    });

    it('should split by " y " connector', () => {
      fixture.componentRef.setInput('ingredients', 'sal y pimienta');
      expect(fixture.componentInstance.items()).toEqual(['Sal', 'Pimienta']);
    });

    it('should capitalise first letter of items starting with a letter', () => {
      fixture.componentRef.setInput('ingredients', 'harina');
      expect(fixture.componentInstance.items()).toEqual(['Harina']);
    });

    it('should not modify items starting with a digit', () => {
      fixture.componentRef.setInput('ingredients', '2 huevos');
      expect(fixture.componentInstance.items()).toEqual(['2 huevos']);
    });

    it('should filter out empty items after splitting', () => {
      fixture.componentRef.setInput('ingredients', 'arroz, , aceite');
      expect(fixture.componentInstance.items()).toEqual(['Arroz', 'Aceite']);
    });

    it('should handle comma and " y " splits together', () => {
      fixture.componentRef.setInput('ingredients', 'tomate, cebolla y ajo');
      expect(fixture.componentInstance.items()).toEqual(['Tomate', 'Cebolla', 'Ajo']);
    });
  });
});
