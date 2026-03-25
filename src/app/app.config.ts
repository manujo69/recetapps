import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    providePrimeNG({ theme: { preset: Aura } }),
    provideTranslateService({ lang: 'es' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    { provide: RecipeRepository, useClass: environment.useMockApi ? RecipeMockRepository : RecipeHttpRepository },
    RecipeStore,
    { provide: AuthRepository, useClass: environment.useMockApi ? AuthMockRepository : AuthHttpRepository },
    AuthService,
  ],
};
