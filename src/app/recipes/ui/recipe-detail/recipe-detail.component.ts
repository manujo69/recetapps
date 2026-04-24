import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecipeStore } from '../../application/recipe.store';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipeInstructionsComponent } from '../recipe-instructions/recipe-instructions.component';
import { RecipeIngredientsComponent } from '../recipe-ingredients/recipe-ingredients.component';
import { FavoriteService } from '../../../favorites/application/favorite.service';
import { AppFooterComponent } from '../../../shared/ui/app-footer/app-footer.component';
import { CategoryStore } from '../../../categories/application/category.store';
import { RecipeImageComponent } from '../recipe-image/recipe-image.component';

@Component({
  selector: 'app-recipe-detail',
  imports: [TranslatePipe, RouterLink, RecipeInstructionsComponent, RecipeIngredientsComponent, AppFooterComponent, RecipeImageComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent implements OnInit {
  private readonly store = inject(RecipeStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly favoriteService = inject(FavoriteService);
  private readonly categoryStore = inject(CategoryStore);

  readonly recipe = this.store.selectedRecipe;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly categories = this.categoryStore.categories;

  readonly uploading = signal(false);
  readonly favoritesLoading = signal(true);
  readonly showDeleteConfirm = signal(false);
  readonly deleting = signal(false);
  readonly isFavorite = computed(() => this.favoriteService.isFavorite(this.recipeId()));
  readonly showCategoryPanel = signal(false);
  readonly selectedCategoryIds = signal(new Set<number>());
  readonly savingCategory = signal(false);

  private readonly localUploadedUrl = signal<string | null>(null);

  readonly isPlaceholderImage = computed(() => {
    if (this.localUploadedUrl()) return false;
    const images = this.recipe()?.images;
    return !images || images.length === 0;
  });

  readonly imageUrl = computed(() => {
    const local = this.localUploadedUrl();
    if (local) return local;
    return this.isPlaceholderImage()
      ? 'images/ingredients-background-010.png'
      : this.recipe()!.images![0].url;
  });

  private readonly recipeId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  ngOnInit(): void {
    const id = this.recipeId();
    this.store.loadById(id);
    this.categoryStore.loadAll();
    this.favoriteService.loadFavorites().subscribe({
      next: () => this.favoritesLoading.set(false),
      error: () => this.favoritesLoading.set(false),
    });
    this.selectedCategoryIds.set(new Set(this.recipe()?.categoryIds ?? []));
  }

  toggleCategoryPanel(): void {
    if (!this.showCategoryPanel()) {
      const recipe = this.recipe();
      let ids: number[];

      if (recipe?.categoryIds?.length) {
        ids = recipe.categoryIds;
      } else if (recipe?.categoryNames?.length) {
        ids = this.categories()
          .filter((c) => recipe.categoryNames!.includes(c.name))
          .map((c) => c.id!);
      } else {
        ids = [];
      }

      this.selectedCategoryIds.set(new Set(ids));
    }
    this.showCategoryPanel.update((v) => !v);
  }

  toggleCategory(categoryId: number): void {
    this.selectedCategoryIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  saveCategories(): void {
    const recipe = this.recipe();
    if (!recipe?.id || this.savingCategory()) return;

    this.savingCategory.set(true);
    this.store.updateCategories(recipe.id, [...this.selectedCategoryIds()]).subscribe({
      next: () => {
        this.savingCategory.set(false);
        this.showCategoryPanel.set(false);
      },
      error: (err) => {
        this.savingCategory.set(false);
        console.error('Error saving categories', err);
      },
    });
  }

  toggleFavorite(): void {
    const id = this.recipeId();
    const action$ = this.isFavorite()
      ? this.favoriteService.removeFavorite(id)
      : this.favoriteService.addFavorite(id);
    action$.subscribe({ error: (err) => console.error('Error toggling favorite', err) });
  }

  deleteRecipe(): void {
    const id = this.recipeId();
    if (!id || this.deleting()) return;

    this.deleting.set(true);
    this.store.delete(id).subscribe({
      next: () => {
        if (this.isFavorite()) {
          this.favoriteService.removeFavorite(id).subscribe({ error: (err) => console.error('Error removing favorite on delete', err) });
        }
        this.router.navigate(['/recipes']);
      },
      error: () => this.deleting.set(false),
    });
  }

  onFileSelected(file: File): void {
    this.uploading.set(true);
    this.store.uploadImage(this.recipeId(), file).subscribe({
      next: (image) => {
        this.uploading.set(false);
        this.localUploadedUrl.set(image.url);
      },
      error: (err) => {
        this.uploading.set(false);
        console.error('Error uploading image', err);
      },
    });
  }
}
