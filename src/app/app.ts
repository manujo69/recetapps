import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './shared/ui/app-header/app-header.component';
import { RecipeStore } from './recipes/application/recipe.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly recipeStore = inject(RecipeStore);
  readonly noRecipes = computed(() => !this.recipeStore.loading() && this.recipeStore.recipes().length === 0);
}
