import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RecipeInstructionsComponent } from './recipe-instructions.component';

describe('RecipeInstructionsComponent', () => {
  let fixture: ComponentFixture<RecipeInstructionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeInstructionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecipeInstructionsComponent);
  });

  it('should create', () => {
    fixture.componentRef.setInput('instructions', '1. Hervir agua.');
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('steps()', () => {
    it('should parse a single numbered step', () => {
      fixture.componentRef.setInput('instructions', '1. Hervir agua.');
      expect(fixture.componentInstance.steps()).toEqual([{ number: '1.', text: 'Hervir agua.' }]);
    });

    it('should parse multiple numbered steps', () => {
      fixture.componentRef.setInput('instructions', '1. Hervir agua. 2. Añadir la pasta.');
      const steps = fixture.componentInstance.steps();
      expect(steps.length).toBe(2);
      expect(steps[0]).toEqual({ number: '1.', text: 'Hervir agua.' });
      expect(steps[1]).toEqual({ number: '2.', text: 'Añadir la pasta.' });
    });

    it('should filter out parts that do not match the numbered pattern', () => {
      fixture.componentRef.setInput(
        'instructions',
        'Introducción sin número. 1. Primer paso.',
      );
      const steps = fixture.componentInstance.steps();
      expect(steps.length).toBe(1);
      expect(steps[0]).toEqual({ number: '1.', text: 'Primer paso.' });
    });

    it('should return an empty array when no numbered steps are found', () => {
      fixture.componentRef.setInput('instructions', 'Sin pasos numerados aquí.');
      expect(fixture.componentInstance.steps()).toEqual([]);
    });
  });
});
