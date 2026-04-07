import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { provideTranslateService } from '@ngx-translate/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../application/auth.service';
import { AuthResponse } from '../../domain/auth.model';

const MOCK_RESPONSE: AuthResponse = {
  token: 'test-token',
  type: 'Bearer',
  id: 1,
  username: 'testuser',
  email: 'test@test.com',
};

describe('LoginComponent', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideAnimations(),
        providePrimeNG({ theme: { preset: Aura } }),
        provideTranslateService({ lang: 'es' }),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with loading false and no error', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should call authService.login with credentials on submit', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of(MOCK_RESPONSE));
    spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;
    component.credentials = { email: 'test@test.com', password: '123456' };

    component.submit();
    tick();

    expect(mockAuthService.login).toHaveBeenCalledWith({ email: 'test@test.com', password: '123456' });
  }));

  it('should navigate to /recipes on successful login', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of(MOCK_RESPONSE));
    spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(LoginComponent);

    fixture.componentInstance.submit();
    tick();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes');
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockAuthService.login.and.returnValue(throwError(() => new Error('Credenciales incorrectas')));
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.submit();
    tick();

    expect(component.error()).toBe('Credenciales incorrectas');
    expect(component.loading()).toBeFalse();
  }));

  it('should show fallback error message when error has no message', fakeAsync(() => {
    mockAuthService.login.and.returnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(LoginComponent);
    const component = fixture.componentInstance;

    component.submit();
    tick();

    expect(component.error()).toBe('Error al iniciar sesión');
  }));
});
