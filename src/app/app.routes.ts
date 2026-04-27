import { Routes } from '@angular/router';
import { authGuard } from './auth/infrastructure/auth.guard';

export const routes: Routes = [
  {
    path: 'recipes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./recipes/ui/recipe-list/recipe-list.component').then((m) => m.RecipeListComponent),
  },
   {
    path: 'recipes/favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./recipes/ui/recipe-list/recipe-list.component').then((m) => m.RecipeListComponent),
  },
  {
    path: 'recipes/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./recipes/ui/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
  },
  {
    path: 'recipes/:id/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./recipes/ui/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
  },
  {
    path: 'recipes/:id',
    canActivate: [authGuard],
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./categories/ui/category-list/category-list.component').then(
        (m) => m.CategoryListComponent,
      ),
  },
  {
    path: 'categories/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./categories/ui/category-add/category-add.component').then(
        (m) => m.CategoryAddComponent,
      ),
  },
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
];
