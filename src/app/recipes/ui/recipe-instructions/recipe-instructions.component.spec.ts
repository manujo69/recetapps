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
    it('should parse a single numbered step (N. format)', () => {
      fixture.componentRef.setInput('instructions', '1. Hervir agua.');
      expect(fixture.componentInstance.steps()).toEqual([{ number: '1.', text: 'Hervir agua.' }]);
    });

    it('should split multiple inline numbered steps into separate entries', () => {
      fixture.componentRef.setInput('instructions', '1. Hervir agua. 2. Añadir la pasta.');
      expect(fixture.componentInstance.steps()).toEqual([
        { number: '1.', text: 'Hervir agua.' },
        { number: '2.', text: 'Añadir la pasta.' },
      ]);
    });

    it('should parse newline-separated numbered steps', () => {
      fixture.componentRef.setInput('instructions', '1. Hervir agua.\n2. Añadir la pasta.');
      expect(fixture.componentInstance.steps()).toEqual([
        { number: '1.', text: 'Hervir agua.' },
        { number: '2.', text: 'Añadir la pasta.' },
      ]);
    });

    it('should parse steps with parenthetical format (N)', () => {
      fixture.componentRef.setInput('instructions', '(1) Hervir agua. (2) Añadir la pasta.');
      expect(fixture.componentInstance.steps()).toEqual([
        { number: '1.', text: 'Hervir agua.' },
        { number: '2.', text: 'Añadir la pasta.' },
      ]);
    });

    it('should assign sequential fallback numbers to unnumbered newline-separated steps', () => {
      fixture.componentRef.setInput('instructions', 'Hervir agua.\nAñadir la pasta.');
      expect(fixture.componentInstance.steps()).toEqual([
        { number: '1.', text: 'Hervir agua.' },
        { number: '2.', text: 'Añadir la pasta.' },
      ]);
    });

    it('should assign fallback number 1 to a single unnumbered step', () => {
      fixture.componentRef.setInput('instructions', 'Sin pasos numerados aquí.');
      expect(fixture.componentInstance.steps()).toEqual([
        { number: '1.', text: 'Sin pasos numerados aquí.' },
      ]);
    });

    it('should include unnumbered intro text as a fallback-numbered step', () => {
      fixture.componentRef.setInput('instructions', 'Introducción sin número.\n1. Primer paso.');
      expect(fixture.componentInstance.steps()).toEqual([
        { number: '1.', text: 'Introducción sin número.' },
        { number: '1.', text: 'Primer paso.' },
      ]);
    });

    it('should filter out empty parts after splitting', () => {
      fixture.componentRef.setInput('instructions', '1. Hervir agua.\n\n2. Añadir la pasta.');
      const steps = fixture.componentInstance.steps();
      expect(steps.length).toBe(2);
      expect(steps.every((s) => s.text.length > 0)).toBeTrue();
    });
  });
});
