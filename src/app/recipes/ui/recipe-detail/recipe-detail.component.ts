import { Component, computed, inject, OnInit, signal, viewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeStore } from '../../application/recipe.store';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipeInstructionsComponent } from '../recipe-instructions/recipe-instructions.component';
import { RecipeIngredientsComponent } from '../recipe-ingredients/recipe-ingredients.component';
import { FavoriteService } from '../../../favorites/application/favorite.service';
import { AppFooterComponent } from '../../../shared/ui/app-footer/app-footer.component';
import { CategoryStore } from '../../../categories/application/category.store';

@Component({
  selector: 'app-recipe-detail',
  imports: [TranslatePipe, RouterLink, RecipeInstructionsComponent, RecipeIngredientsComponent, AppFooterComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent implements OnInit {
  private readonly store = inject(RecipeStore);
  private readonly route = inject(ActivatedRoute);
  private readonly favoriteService = inject(FavoriteService);
  private readonly categoryStore = inject(CategoryStore);

  readonly recipe = this.store.selectedRecipe;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly categories = this.categoryStore.categories;

  readonly uploading = signal(false);
  readonly isFavorite = signal(false);
  readonly showCategoryPanel = signal(false);
  readonly selectedCategoryIds = signal(new Set<number>());
  readonly savingCategory = signal(false);

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
    const id = this.recipeId();
    this.store.loadById(id);
    this.categoryStore.loadAll();
    this.favoriteService.isFavorite(id).subscribe({
      next: (isFav) => this.isFavorite.set(isFav),
      error: () => { /* empty */ },
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
      error: () => this.savingCategory.set(false),
    });
  }

  openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  toggleFavorite(): void {
    const id = this.recipeId();
    const current = this.isFavorite();
    this.isFavorite.set(!current);
    const action$ = current
      ? this.favoriteService.removeFavorite(id)
      : this.favoriteService.addFavorite(id);
    action$.subscribe({ error: () => this.isFavorite.set(current) });
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
