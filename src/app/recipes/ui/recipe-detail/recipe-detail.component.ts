import { Component, computed, inject, OnInit, signal, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeStore } from '../../application/recipe.store';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipeInstructionsComponent } from '../recipe-instructions/recipe-instructions.component';
import { RecipeIngredientsComponent } from '../recipe-ingredients/recipe-ingredients.component';

@Component({
  selector: 'app-recipe-detail',
  imports: [TranslatePipe, RouterLink, RecipeInstructionsComponent, RecipeIngredientsComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent implements OnInit {
  private readonly store = inject(RecipeStore);
  private readonly route = inject(ActivatedRoute);

  // Alias hacia las signals del store — el template no necesita cambiar
  readonly recipe = this.store.selectedRecipe;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  // Estado local exclusivo de esta vista
  readonly uploading = signal(false);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  readonly isPlaceholderImage = computed(() => {
    const images = this.recipe()?.images;
    return !images || images.length === 0;
  });

  readonly imageUrl = computed(() => {
    return this.isPlaceholderImage()
      ? 'images/ingredients-background-010.png'
      : this.recipe()!.images![0].url;
  });

  private readonly recipeId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  ngOnInit(): void {
    this.store.loadById(this.recipeId());
  }

  openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.store.uploadImage(this.recipeId(), file).subscribe({
      next: () => this.uploading.set(false),
      error: () => this.uploading.set(false),
    });
  }
}
