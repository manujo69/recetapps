import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthRepository } from '../domain/auth.repository';
import { AuthRequest, AuthResponse, LoginRequest } from '../domain/auth.model';

const mockResponse: AuthResponse = {
  token: 'test-token',
  type: 'Bearer',
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
};

describe('AuthService', () => {
  let service: AuthService;
  let repositorySpy: jasmine.SpyObj<AuthRepository>;

  beforeEach(() => {
    repositorySpy = jasmine.createSpyObj<AuthRepository>('AuthRepository', ['login', 'register']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: repositorySpy },
      ],
    });

    service = TestBed.inject(AuthService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have currentUser as null', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('should have isAuthenticated as false', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  describe('login()', () => {
    const credentials: LoginRequest = { email: 'test@example.com', password: 'password' };

    it('should call repository.login with credentials', () => {
      repositorySpy.login.and.returnValue(of(mockResponse));

      service.login(credentials).subscribe();

      expect(repositorySpy.login).toHaveBeenCalledOnceWith(credentials);
    });

    it('should set currentUser on success', () => {
      repositorySpy.login.and.returnValue(of(mockResponse));

      service.login(credentials).subscribe();

      expect(service.currentUser()).toEqual(mockResponse);
    });

    it('should store token in localStorage on success', () => {
      repositorySpy.login.and.returnValue(of(mockResponse));

      service.login(credentials).subscribe();

      expect(localStorage.getItem('token')).toBe('test-token');
    });

    it('should set isAuthenticated to true on success', () => {
      repositorySpy.login.and.returnValue(of(mockResponse));

      service.login(credentials).subscribe();

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return the AuthResponse in the observable', () => {
      repositorySpy.login.and.returnValue(of(mockResponse));
      let result: AuthResponse | undefined;

      service.login(credentials).subscribe((r) => (result = r));

      expect(result).toEqual(mockResponse);
    });

    it('should not update state if repository errors', () => {
      repositorySpy.login.and.returnValue(throwError(() => new Error('Unauthorized')));

      service.login(credentials).subscribe({ error: () => {} });

      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register()', () => {
    const data: AuthRequest = { username: 'testuser', email: 'test@example.com', password: 'password' };

    it('should call repository.register with data', () => {
      repositorySpy.register.and.returnValue(of(mockResponse));

      service.register(data).subscribe();

      expect(repositorySpy.register).toHaveBeenCalledOnceWith(data);
    });

    it('should set currentUser on success', () => {
      repositorySpy.register.and.returnValue(of(mockResponse));

      service.register(data).subscribe();

      expect(service.currentUser()).toEqual(mockResponse);
    });

    it('should store token in localStorage on success', () => {
      repositorySpy.register.and.returnValue(of(mockResponse));

      service.register(data).subscribe();

      expect(localStorage.getItem('token')).toBe('test-token');
    });

    it('should set isAuthenticated to true on success', () => {
      repositorySpy.register.and.returnValue(of(mockResponse));

      service.register(data).subscribe();

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return the AuthResponse in the observable', () => {
      repositorySpy.register.and.returnValue(of(mockResponse));
      let result: AuthResponse | undefined;

      service.register(data).subscribe((r) => (result = r));

      expect(result).toEqual(mockResponse);
    });

    it('should not update state if repository errors', () => {
      repositorySpy.register.and.returnValue(throwError(() => new Error('Conflict')));

      service.register(data).subscribe({ error: () => {} });

      expect(service.currentUser()).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout()', () => {
    it('should set currentUser to null', () => {
      repositorySpy.login.and.returnValue(of(mockResponse));
      service.login({ email: 'test@example.com', password: 'password' }).subscribe();

      service.logout();

      expect(service.currentUser()).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      repositorySpy.login.and.returnValue(of(mockResponse));
      service.login({ email: 'test@example.com', password: 'password' }).subscribe();

      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should remove token from localStorage', () => {
      localStorage.setItem('token', 'test-token');

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('getToken()', () => {
    it('should return null when no token is stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return the token when one is stored', () => {
      localStorage.setItem('token', 'test-token');

      expect(service.getToken()).toBe('test-token');
    });
  });
});
