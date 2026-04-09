import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  // Alias hacia las signals del store — el template no necesita cambiar
  readonly recipes = this.recipeService.recipes;
  readonly loading = this.recipeService.loading;
  readonly error = this.recipeService.error;

  ngOnInit(): void {
    this.recipeService.loadAll();
  }
}
