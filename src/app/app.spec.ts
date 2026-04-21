import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { AuthService } from './auth/application/auth.service';
import { NetworkService } from './shared/infrastructure/network.service';

describe('App', () => {
  beforeEach(async () => {
    const mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);
    const mockNetworkService = jasmine.createSpyObj<NetworkService>('NetworkService', ['initialize']);
    mockNetworkService.initialize.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideTranslateService({ lang: 'es' }),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NetworkService, useValue: mockNetworkService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have title signal set to recetapps', () => {
    const fixture = TestBed.createComponent(App);
    expect((fixture.componentInstance as unknown as { title: () => string }).title()).toBe('recetapps');
  });
});
