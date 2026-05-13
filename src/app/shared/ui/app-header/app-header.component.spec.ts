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

  describe('hideFavorites input', () => {
    it('should not apply invisible class to favorites button by default', () => {
      const fixture = TestBed.createComponent(AppHeaderComponent);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.app-header__favorites');
      expect(button.classList.contains('invisible')).toBeFalse();
    });

    it('should apply invisible class to favorites button when hideFavorites is true', () => {
      const fixture = TestBed.createComponent(AppHeaderComponent);
      fixture.componentRef.setInput('hideFavorites', true);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.app-header__favorites');
      expect(button.classList.contains('invisible')).toBeTrue();
    });

    it('should remove invisible class when hideFavorites changes back to false', () => {
      const fixture = TestBed.createComponent(AppHeaderComponent);
      fixture.componentRef.setInput('hideFavorites', true);
      fixture.detectChanges();

      fixture.componentRef.setInput('hideFavorites', false);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector('.app-header__favorites');
      expect(button.classList.contains('invisible')).toBeFalse();
    });
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
