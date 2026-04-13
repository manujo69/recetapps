import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipeSummary } from '../../domain/recipe.model';

@Component({
  selector: 'app-recipe-panel',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './recipe-panel.component.html',
  styleUrl: './recipe-panel.component.scss',
})
export class RecipePanelComponent {
  readonly recipe = input.required<RecipeSummary>();
  readonly isFavorite = input<boolean>(false);

  readonly imageUrl = computed(
    () => this.recipe().firstImageUrl ?? 'images/ingredients-background-010.png',
  );
}
