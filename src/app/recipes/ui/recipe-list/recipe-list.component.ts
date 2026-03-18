import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Recipe } from '../../domain/recipe.model';
import { RecipeService } from '../../application/recipe.service';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipePanelComponent } from '../recipe-panel/recipe-panel.component';

@Component({
  selector: 'app-recipe-list',
  imports: [TranslatePipe, RecipePanelComponent, RouterLink],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.scss',
})
export class RecipeListComponent implements OnInit {
  private readonly recipeService = inject(RecipeService);

  readonly recipes = signal<Recipe[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.recipeService.getAll().subscribe({
      next: (recipes) => {
        this.recipes.set(recipes);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Error al cargar las recetas');
        this.loading.set(false);
      },
    });
  }

  addRecipe(): void {

  }
}
