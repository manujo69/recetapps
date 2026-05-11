import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { Capacitor } from '@capacitor/core';

import { RecipeRepository } from './recipes/domain/recipe.repository';
import { RecipeMockRepository } from './recipes/infrastructure/recipe-mock.repository';
import { RecipeSqliteRepository } from './recipes/infrastructure/recipe-sqlite.repository';
import { RecipeStore } from './recipes/application/recipe.store';

import { FavoriteRepository } from './favorites/domain/favorite.repository';
import { FavoriteMockRepository } from './favorites/infrastructure/favorite-mock.repository';
import { FavoriteSqliteRepository } from './favorites/infrastructure/favorite-sqlite.repository';
import { FavoriteService } from './favorites/application/favorite.service';

import { CategoryRepository } from './categories/domain/category.repository';
import { CategoryMockRepository } from './categories/infrastructure/category-mock.repository';
import { CategorySqliteRepository } from './categories/infrastructure/category-sqlite.repository';
import { CategoryStore } from './categories/application/category.store';

const native = Capacitor.isNativePlatform();

function recipeAdapter() {
  return native ? RecipeSqliteRepository : RecipeMockRepository;
}

function favoriteAdapter() {
  return native ? FavoriteSqliteRepository : FavoriteMockRepository;
}

function categoryAdapter() {
  return native ? CategorySqliteRepository : CategoryMockRepository;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(),
    providePrimeNG({ theme: { preset: Aura } }),
    provideTranslateService({ lang: 'es' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    { provide: RecipeRepository, useClass: recipeAdapter() },
    RecipeStore,
    { provide: FavoriteRepository, useClass: favoriteAdapter() },
    FavoriteService,
    { provide: CategoryRepository, useClass: categoryAdapter() },
    CategoryStore,
  ],
};
