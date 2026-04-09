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

  describe('sections()', () => {
    describe('comma-separated format (single line)', () => {
      it('should split by comma into a single untitled section', () => {
        fixture.componentRef.setInput('ingredients', 'arroz, patatas, aceite');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: null, items: ['arroz', 'patatas', 'aceite'] },
        ]);
      });

      it('should filter out empty items between consecutive commas', () => {
        fixture.componentRef.setInput('ingredients', 'arroz, , aceite');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: null, items: ['arroz', 'aceite'] },
        ]);
      });

      it('should not split on commas inside parentheses', () => {
        fixture.componentRef.setInput('ingredients', 'harina (tipo 00, integral), sal');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: null, items: ['harina (tipo 00, integral)', 'sal'] },
        ]);
      });
    });

    describe('dash-list format', () => {
      it('should parse dash-prefixed lines into items', () => {
        fixture.componentRef.setInput('ingredients', '- arroz\n- sal\n- aceite');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: null, items: ['arroz', 'sal', 'aceite'] },
        ]);
      });

      it('should ignore non-dash lines when dash format is detected', () => {
        fixture.componentRef.setInput('ingredients', 'texto extra\n- arroz\n- sal');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: null, items: ['arroz', 'sal'] },
        ]);
      });
    });

    describe('newline-separated format', () => {
      it('should split multiple lines into items', () => {
        fixture.componentRef.setInput('ingredients', 'arroz\npatatas\naceite');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: null, items: ['arroz', 'patatas', 'aceite'] },
        ]);
      });

      it('should strip trailing commas from newline-separated items', () => {
        fixture.componentRef.setInput('ingredients', 'arroz,\npatatas,\naceite');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: null, items: ['arroz', 'patatas', 'aceite'] },
        ]);
      });
    });

    describe('section headers', () => {
      it('should group items under a titled section when a line ends with ":"', () => {
        fixture.componentRef.setInput('ingredients', '- Para la masa:\n- harina\n- agua');
        expect(fixture.componentInstance.sections()).toEqual([
          { title: 'Para la masa', items: ['harina', 'agua'] },
        ]);
      });

      it('should create multiple titled sections from multiple headers', () => {
        fixture.componentRef.setInput(
          'ingredients',
          '- Base:\n- harina\n- agua\n- Relleno:\n- queso\n- tomate',
        );
        expect(fixture.componentInstance.sections()).toEqual([
          { title: 'Base', items: ['harina', 'agua'] },
          { title: 'Relleno', items: ['queso', 'tomate'] },
        ]);
      });
    });
  });
});
