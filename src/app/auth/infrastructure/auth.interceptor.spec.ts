import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
  HttpErrorResponse
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../application/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
      'getToken',
      'logout',
      'isAuthenticated'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('Authorization header', () => {
    it('should add Bearer token header when token exists', () => {
      mockAuthService.getToken.and.returnValue('my-token');
      http.get('/api/test').subscribe();

      const req = httpTesting.expectOne('/api/test');
      expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
      req.flush({});
    });

    it('should not add Authorization header when no token', () => {
      mockAuthService.getToken.and.returnValue(null);
      http.get('/api/test').subscribe();

      const req = httpTesting.expectOne('/api/test');
      expect(req.request.headers.has('Authorization')).toBeFalse();
      req.flush({});
    });
  });

  describe('403 error handling', () => {
    it('should call logout and navigate to /login on 403', () => {
      mockAuthService.getToken.and.returnValue('my-token');
      const navigateSpy = spyOn(router, 'navigateByUrl');

      http.get('/api/test').subscribe({
        error: () => console.warn('Unauthorized access')
      });

      httpTesting
        .expectOne('/api/test')
        .flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      expect(navigateSpy).toHaveBeenCalledOnceWith('/login');
    });

    it('should rethrow the error after handling 403', () => {
      mockAuthService.getToken.and.returnValue(null);

      let caughtError: HttpErrorResponse | undefined;

      http.get('/api/test').subscribe({
        error: (e: HttpErrorResponse) => (caughtError = e)
      });

      httpTesting
        .expectOne('/api/test')
        .flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(caughtError?.status).toBe(403);
    });

    it('should not logout on non-403 errors', () => {
      mockAuthService.getToken.and.returnValue('my-token');

      http.get('/api/test').subscribe({
        error: () => console.warn('Unauthorized access')
      });

      httpTesting
        .expectOne('/api/test')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it('should rethrow non-403 errors unchanged', () => {
      mockAuthService.getToken.and.returnValue(null);

      let caughtStatus: number | undefined;

      http.get('/api/test').subscribe({
        error: (e: HttpErrorResponse) => (caughtStatus = e.status)
      });

      httpTesting
        .expectOne('/api/test')
        .flush('Error', { status: 500, statusText: 'Server Error' });

      expect(caughtStatus).toBe(500);
    });
  });
});
