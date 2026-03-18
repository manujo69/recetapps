import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-recipe-ingredients',
  templateUrl: './recipe-ingredients.component.html',
  styleUrl: './recipe-ingredients.component.scss',
})
export class RecipeIngredientsComponent {
  readonly ingredients = input.required<string>();

  readonly items = computed<string[]>(() =>
    this.ingredients()
      .split(',')
      .flatMap((chunk) => chunk.split(/\sy\s/))
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => (/^\d/.test(item) ? item : item[0].toUpperCase() + item.slice(1))),
  );
}
