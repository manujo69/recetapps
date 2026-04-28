import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/infrastructure/auth.interceptor';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { Capacitor } from '@capacitor/core';

import { RecipeRepository } from './recipes/domain/recipe.repository';
import { RecipeHttpRepository } from './recipes/infrastructure/recipe-http.repository';
import { RecipeMockRepository } from './recipes/infrastructure/recipe-mock.repository';
import { RecipeSqliteRepository } from './recipes/infrastructure/recipe-sqlite.repository';
import { RecipeStore } from './recipes/application/recipe.store';

import { AuthRepository } from './auth/domain/auth.repository';
import { AuthHttpRepository } from './auth/infrastructure/auth-http.repository';
import { AuthMockRepository } from './auth/infrastructure/auth-mock.repository';
import { AuthService } from './auth/application/auth.service';

import { FavoriteRepository } from './favorites/domain/favorite.repository';
import { FavoriteHttpRepository } from './favorites/infrastructure/favorite-http.repository';
import { FavoriteMockRepository } from './favorites/infrastructure/favorite-mock.repository';
import { FavoriteSqliteRepository } from './favorites/infrastructure/favorite-sqlite.repository';
import { FavoriteService } from './favorites/application/favorite.service';

import { CategoryRepository } from './categories/domain/category.repository';
import { CategoryHttpRepository } from './categories/infrastructure/category-http.repository';
import { CategoryMockRepository } from './categories/infrastructure/category-mock.repository';
import { CategorySqliteRepository } from './categories/infrastructure/category-sqlite.repository';
import { CategoryStore } from './categories/application/category.store';
import { SyncService } from './sync/application/sync.service';
import { NetworkService } from './shared/infrastructure/network.service';

const native = Capacitor.isNativePlatform();

function recipeAdapter() {
  if (environment.useMockApi) return RecipeMockRepository;
  return native ? RecipeSqliteRepository : RecipeHttpRepository;
}

function favoriteAdapter() {
  if (environment.useMockApi) return FavoriteMockRepository;
  return native ? FavoriteSqliteRepository : FavoriteHttpRepository;
}

function categoryAdapter() {
  if (environment.useMockApi) return CategoryMockRepository;
  return native ? CategorySqliteRepository : CategoryHttpRepository;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({ theme: { preset: Aura } }),
    provideTranslateService({ lang: 'es' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    { provide: RecipeRepository, useClass: recipeAdapter() },
    RecipeStore,
    { provide: AuthRepository, useClass: environment.useMockApi ? AuthMockRepository : AuthHttpRepository },
    AuthService,
    { provide: FavoriteRepository, useClass: favoriteAdapter() },
    FavoriteService,
    { provide: CategoryRepository, useClass: categoryAdapter() },
    CategoryStore,
    SyncService,
    NetworkService,
    provideAppInitializer(async () => {
      const authService = inject(AuthService);
      const syncService = inject(SyncService);
      const networkService = inject(NetworkService);

      authService.restoreSession();

      if (Capacitor.isNativePlatform() && authService.isAuthenticated()) {
        try { await syncService.push(); } catch { /* no-op: sync failures at startup are non-fatal */ }
        try { await syncService.pull(); } catch { /* no-op: sync failures at startup are non-fatal */ }
      }

      await networkService.initialize();
    }),
  ],
};
