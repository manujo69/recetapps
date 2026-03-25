import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecipeStore } from '../../application/recipe.store';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipePanelComponent } from '../recipe-panel/recipe-panel.component';

@Component({
  selector: 'app-recipe-list',
  imports: [TranslatePipe, RecipePanelComponent, RouterLink],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.scss',
})
export class RecipeListComponent implements OnInit {
  private readonly store = inject(RecipeStore);

  // Alias hacia las signals del store — el template no necesita cambiar
  readonly recipes = this.store.recipes;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  ngOnInit(): void {
    this.store.loadAll();
  }
}
