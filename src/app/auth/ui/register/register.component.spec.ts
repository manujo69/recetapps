import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../application/auth.service';
import { AuthResponse } from '../../domain/auth.model';

const MOCK_RESPONSE: AuthResponse = {
  token: 'test-token',
  type: 'Bearer',
  id: 1,
  username: 'newuser',
  email: 'new@test.com',
};

describe('RegisterComponent', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        providePrimeNG({ theme: { preset: Aura } }),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start with loading false and no error', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('should call authService.register with form data on submit', fakeAsync(() => {
    mockAuthService.register.and.returnValue(of(MOCK_RESPONSE));
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.data = { username: 'newuser', email: 'new@test.com', password: 'secret123' };

    component.submit();
    tick();

    expect(mockAuthService.register).toHaveBeenCalledWith({
      username: 'newuser',
      email: 'new@test.com',
      password: 'secret123',
    });
  }));

  it('should navigate to /recipes on successful registration', fakeAsync(() => {
    mockAuthService.register.and.returnValue(of(MOCK_RESPONSE));
    spyOn(router, 'navigateByUrl');
    const fixture = TestBed.createComponent(RegisterComponent);

    fixture.componentInstance.submit();
    tick();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/recipes');
  }));

  it('should set error message and stop loading on failure', fakeAsync(() => {
    mockAuthService.register.and.returnValue(throwError(() => new Error('El email ya está registrado')));
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;

    component.submit();
    tick();

    expect(component.error()).toBe('El email ya está registrado');
    expect(component.loading()).toBeFalse();
  }));
});
