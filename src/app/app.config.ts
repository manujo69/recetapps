import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/infrastructure/auth.interceptor';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

import { RecipeRepository } from './recipes/domain/recipe.repository';
import { RecipeHttpRepository } from './recipes/infrastructure/recipe-http.repository';
import { RecipeMockRepository } from './recipes/infrastructure/recipe-mock.repository';
import { RecipeStore } from './recipes/application/recipe.store';

import { AuthRepository } from './auth/domain/auth.repository';
import { AuthHttpRepository } from './auth/infrastructure/auth-http.repository';
import { AuthMockRepository } from './auth/infrastructure/auth-mock.repository';
import { AuthService } from './auth/application/auth.service';

import { FavoriteRepository } from './favorites/domain/favorite.repository';
import { FavoriteHttpRepository } from './favorites/infrastructure/favorite-http.repository';
import { FavoriteMockRepository } from './favorites/infrastructure/favorite-mock.repository';
import { FavoriteService } from './favorites/application/favorite.service';

import { CategoryRepository } from './categories/domain/category.repository';
import { CategoryHttpRepository } from './categories/infrastructure/category-http.repository';
import { CategoryMockRepository } from './categories/infrastructure/category-mock.repository';
import { CategoryStore } from './categories/application/category.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
providePrimeNG({ theme: { preset: Aura } }),
    provideTranslateService({ lang: 'es' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    { provide: RecipeRepository, useClass: environment.useMockApi ? RecipeMockRepository : RecipeHttpRepository },
    RecipeStore,
    { provide: AuthRepository, useClass: environment.useMockApi ? AuthMockRepository : AuthHttpRepository },
    AuthService,
    { provide: FavoriteRepository, useClass: environment.useMockApi ? FavoriteMockRepository : FavoriteHttpRepository },
    FavoriteService,
    { provide: CategoryRepository, useClass: environment.useMockApi ? CategoryMockRepository : CategoryHttpRepository },
    CategoryStore,
  ],
};
