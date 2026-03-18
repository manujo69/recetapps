import { Component, computed, inject, OnInit, signal, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Recipe } from '../../domain/recipe.model';
import { RecipeService } from '../../application/recipe.service';
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
  private readonly recipeService = inject(RecipeService);
  private readonly route = inject(ActivatedRoute);

  readonly recipe = signal<Recipe | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
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
    this.loadRecipe();
  }

  openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.recipeService.uploadImage(this.recipeId(), file).subscribe({
      next: (image) => {
        const current = this.recipe();
        if (current) {
          this.recipe.set({ ...current, images: [image, ...(current.images ?? [])] });
        }
        this.uploading.set(false);
      },
      error: () => {
        this.uploading.set(false);
      },
    });
  }

  private loadRecipe(): void {
    this.recipeService.getById(this.recipeId()).subscribe({
      next: (recipe) => {
        this.recipe.set(recipe);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Receta no encontrada');
        this.loading.set(false);
      },
    });
  }
}
