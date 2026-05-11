import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AppHeaderComponent } from './app-header.component';

describe('AppHeaderComponent', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AppHeaderComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('getFavorites()', () => {
    it('should navigate to /recipes with favorites queryParam when showFavoritesLink is true', () => {
      spyOn(router, 'navigate');
      const fixture = TestBed.createComponent(AppHeaderComponent);
      spyOn(fixture.componentInstance, 'showFavoritesLink').and.returnValue(true);

      fixture.componentInstance.getFavorites();

      expect(router.navigate).toHaveBeenCalledWith(['/recipes'], { queryParams: { favorites: true } });
    });

    it('should navigate to /recipes without queryParams when showFavoritesLink is false', () => {
      spyOn(router, 'navigate');
      const fixture = TestBed.createComponent(AppHeaderComponent);
      spyOn(fixture.componentInstance, 'showFavoritesLink').and.returnValue(false);

      fixture.componentInstance.getFavorites();

      expect(router.navigate).toHaveBeenCalledWith(['/recipes'], { queryParams: {} });
    });
  });
});
