import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RecipeStore } from '../../application/recipe.store';
import { TranslatePipe } from '@ngx-translate/core';
import { RecipePanelComponent } from '../recipe-panel/recipe-panel.component';
import { FavoriteService } from '../../../favorites/application/favorite.service';
import { AppFooterComponent } from '../../../shared/ui/app-footer/app-footer.component';
import { CategoryStore } from '../../../categories/application/category.store';

@Component({
  selector: 'app-recipe-list',
  imports: [TranslatePipe, RecipePanelComponent, RouterLink, AppFooterComponent],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.scss',
})
export class RecipeListComponent implements OnInit {
  private readonly store = inject(RecipeStore);
  private readonly favoriteService = inject(FavoriteService);
  private readonly categoryStore = inject(CategoryStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly favoriteIds = this.favoriteService.favoriteIds;

  readonly activeCategoryId = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => (params.get('categoryId') ? Number(params.get('categoryId')) : null)),
    ),
    { initialValue: null },
  );

  readonly favoritesOnly = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('favorites') === 'true')),
    { initialValue: false },
  );

  readonly activeCategory = computed(() => {
    const id = this.activeCategoryId();
    return id ? this.categoryStore.categories().find((c) => c.id === id) ?? null : null;
  });

  readonly recipes = computed(() => {
    const all = [...this.store.recipes()].sort((a, b) => b.id - a.id);
    const catId = this.activeCategoryId();
    if (this.favoritesOnly()) {
      return all.filter((r) => this.favoriteIds().has(r.id));
    }
    if (!catId) return all;
    return all.filter((r) => r.categoryIds?.includes(catId));
  });

  ngOnInit(): void {
    this.store.loadAll();
    this.categoryStore.loadAll();
    this.favoriteService.loadFavorites().subscribe({
      error: () => console.error('Error al cargar favoritos'),
    });
  }

  clearFilter(): void {
    this.router.navigate([], { queryParams: {} });
  }
}
