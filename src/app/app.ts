import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './shared/ui/app-header/app-header.component';
import { FavoriteService } from './favorites/application/favorite.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly favoriteService = inject(FavoriteService);
  readonly noFavorites = computed(
    () => this.favoriteService.loaded() && this.favoriteService.favoriteIds().size === 0,
  );
}
