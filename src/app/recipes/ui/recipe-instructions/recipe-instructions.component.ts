import { Component, computed, input } from '@angular/core';

interface InstructionStep {
  number: string;
  text: string;
}

@Component({
  selector: 'app-recipe-instructions',
  templateUrl: './recipe-instructions.component.html',
  styleUrl: './recipe-instructions.component.scss',
})
export class RecipeInstructionsComponent {
  readonly instructions = input.required<string>();

  readonly steps = computed<InstructionStep[]>(() => {
    const parts = this.instructions().split(/(?=\d+\.\s)/);
    return parts
      .map((part) => {
        const match = part.match(/^(\d+\.)\s*([\s\S]*)/);
        return match ? { number: match[1], text: match[2].trim() } : null;
      })
      .filter((step): step is InstructionStep => step !== null);
  });
}
