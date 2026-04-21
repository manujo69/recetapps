import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../application/auth.service';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'getToken',
      'logout'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    router = TestBed.inject(Router);

    // Mocks tipados sin any
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/test' } as RouterStateSnapshot;
  });

  it('should return true when user is authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState)
    );

    expect(result).toBeTrue();
  });

  it('should return a UrlTree to /login when not authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState)
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('should not redirect when authenticated', () => {
    mockAuthService.isAuthenticated.and.returnValue(true);
    const navigateSpy = spyOn(router, 'createUrlTree').and.callThrough();

    TestBed.runInInjectionContext(() =>
      authGuard(mockRoute, mockState)
    );

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
