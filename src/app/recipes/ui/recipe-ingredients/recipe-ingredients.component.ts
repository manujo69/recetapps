import { Component, computed, input } from '@angular/core';

export interface IngredientSection {
  title: string | null;
  items: string[];
}

@Component({
  selector: 'app-recipe-ingredients',
  templateUrl: './recipe-ingredients.component.html',
  styleUrl: './recipe-ingredients.component.scss',
})
export class RecipeIngredientsComponent {
  readonly ingredients = input.required<string>();

  readonly sections = computed<IngredientSection[]>(() => {
    const text = this.ingredients().trim();
    const lines = text.split(/\r?\n/).map((l) => l.trim());

    // Resolve flat item list based on detected format
    let flatItems: string[];

    if (lines.some((l) => l.startsWith('-'))) {
      // Dash-list format: "- item\n- item\n..."
      flatItems = lines
        .filter((l) => l.startsWith('-'))
        .map((l) => l.replace(/^-\s*/, '').trim())
        .filter((l) => l.length > 0);
    } else if (lines.length > 1) {
      // Newline-separated format (no dashes): one ingredient per line
      // Strip trailing commas left by some API formats
      flatItems = lines.filter((l) => l.length > 0).map((l) => l.replace(/,\s*$/, ''));
    } else {
      // Comma-separated format — split on commas outside parentheses
      flatItems = [];
      let depth = 0;
      let current = '';
      for (const char of text) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
          const item = current.trim();
          if (item) flatItems.push(item);
          current = '';
          continue;
        }
        current += char;
      }
      const last = current.trim();
      if (last) flatItems.push(last);
    }

    // Group flat items into sections (lines ending with ":" are section headers)
    const sections: IngredientSection[] = [];
    let current: IngredientSection = { title: null, items: [] };

    for (const item of flatItems) {
      if (item.endsWith(':')) {
        if (current.items.length > 0 || current.title !== null) {
          sections.push(current);
        }
        current = { title: item.slice(0, -1).trim(), items: [] };
      } else {
        current.items.push(item);
      }
    }
    if (current.items.length > 0 || current.title !== null) {
      sections.push(current);
    }

    return sections;
  });
}
