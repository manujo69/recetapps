import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'recipes',
    loadComponent: () =>
      import('./recipes/ui/recipe-list/recipe-list.component').then((m) => m.RecipeListComponent),
  },
  {
    path: 'recipes/favorites',
    loadComponent: () =>
      import('./recipes/ui/recipe-list/recipe-list.component').then((m) => m.RecipeListComponent),
  },
  {
    path: 'recipes/new',
    loadComponent: () =>
      import('./recipes/ui/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () =>
      import('./recipes/ui/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
  },
  {
    path: 'recipes/:id',
    loadComponent: () =>
      import('./recipes/ui/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./categories/ui/category-list/category-list.component').then(
        (m) => m.CategoryListComponent,
      ),
  },
  {
    path: 'categories/new',
    loadComponent: () =>
      import('./categories/ui/category-add/category-add.component').then(
        (m) => m.CategoryAddComponent,
      ),
  },
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
];
