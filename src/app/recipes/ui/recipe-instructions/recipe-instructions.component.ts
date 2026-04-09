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
    const text = this.instructions().trim();

    // Splits on:
    //   - one or more newlines (\n, \r\n, \r)
    //   - inline step markers preceded by whitespace or start of string:
    //       N followed by one or more non-alphanumeric, non-space symbols then a space
    //       e.g. 1.  1-  1.-  1/  1)  1:  (1)
    // \d+ is greedy so multi-digit numbers (10, 11, …) are matched in full.
    const STEP_SPLIT = /[\r\n]+|(?<!\S)(?=(?:\(\d+\)|\d+[^\w\s]+)\s)/;

    // Groups: [1] digits from (N) form · [2] digits from N<sym> form · [3] step text
    const STEP_CAPTURE = /^(?:\((\d+)\)|(\d+)[^\w\s]+)\s*([\s\S]*)/;

    const parts = text.split(STEP_SPLIT).filter((part) => part.trim());

    return parts
      .map((part, i) => {
        const match = part.match(STEP_CAPTURE);
        if (match) {
          const digits = match[1] ?? match[2];
          return { number: `${digits}.`, text: match[3].trim() };
        }
        return { number: `${i + 1}.`, text: part.trim() };
      })
      .filter((step) => step.text.length > 0);
  });
}
