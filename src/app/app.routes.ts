import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'recipes',
    loadComponent: () =>
      import('./recipes/ui/recipe-list/recipe-list.component').then((m) => m.RecipeListComponent),
  },
  {
    path: 'recipes/new',
    loadComponent: () =>
      import('./recipes/ui/recipe-add/recipe-add.component').then((m) => m.RecipeAddComponent),
  },
  {
    path: 'recipes/:id',
    loadComponent: () =>
      import('./recipes/ui/recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/ui/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/ui/register/register.component').then((m) => m.RegisterComponent),
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
