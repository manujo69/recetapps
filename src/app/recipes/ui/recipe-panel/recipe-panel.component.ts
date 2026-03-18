import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Recipe } from '../../domain/recipe.model';

@Component({
  selector: 'app-recipe-panel',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './recipe-panel.component.html',
  styleUrl: './recipe-panel.component.scss',
})
export class RecipePanelComponent {
  readonly recipe = input.required<Recipe>();

  readonly imageUrl = computed(() => {
    const images = this.recipe().images;
    return images && images.length > 0 ? images[0].url : 'images/ingredients-background-010.png';
  });
}
