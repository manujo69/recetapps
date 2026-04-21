import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AppHeaderComponent } from './app-header.component';
import { AuthService } from '../../../auth/application/auth.service';

describe('AppHeaderComponent', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('logout()', () => {
    it('should call authService.logout', () => {
      spyOn(router, 'navigate');
      const fixture = TestBed.createComponent(AppHeaderComponent);

      fixture.componentInstance.logout();

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('should navigate to /login', () => {
      spyOn(router, 'navigate');
      const fixture = TestBed.createComponent(AppHeaderComponent);

      fixture.componentInstance.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should call authService.logout before navigating', () => {
      const callOrder: string[] = [];
      mockAuthService.logout.and.callFake(() => callOrder.push('logout'));
      spyOn(router, 'navigate').and.callFake(() => {
        callOrder.push('navigate');
        return Promise.resolve(true);
      });
      const fixture = TestBed.createComponent(AppHeaderComponent);

      fixture.componentInstance.logout();

      expect(callOrder).toEqual(['logout', 'navigate']);
    });

    it('should navigate to /favorites when showFavoritesLink is true', () => {
      spyOn(router, 'navigate');
      const fixture = TestBed.createComponent(AppHeaderComponent);
      spyOn(fixture.componentInstance, 'showFavoritesLink').and.returnValue(true);

      fixture.componentInstance.getFavorites();

      expect(router.navigate).toHaveBeenCalledWith(['/recipes'], { queryParams: { favorites: true } });
    });

    it('should navigate without queryParams when showFavoritesLink is false', () => {
      spyOn(router, 'navigate');
      const fixture = TestBed.createComponent(AppHeaderComponent);
      spyOn(fixture.componentInstance, 'showFavoritesLink').and.returnValue(false);

      fixture.componentInstance.getFavorites();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/recipes'],
        { queryParams: {} }
      );
    });

  });
});
