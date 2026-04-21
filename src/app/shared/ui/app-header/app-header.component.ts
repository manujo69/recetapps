import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../auth/application/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.scss',
})
export class AppHeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly showFavoritesLink = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.parseUrl(this.router.url).queryParams['favorites'] !== 'true'),
    ),
    { initialValue: true },
  );

  getFavorites(): void {
    const goingToFavorites = this.showFavoritesLink();
    this.router.navigate(['/recipes'], { queryParams: goingToFavorites ? { favorites: true } : {} });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
