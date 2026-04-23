import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { RecipeSummary } from '../../recipes/domain/recipe.model';
import { FavoriteRepository } from '../domain/favorite.repository';
import { NetworkService } from '../../shared/infrastructure/network.service';
import { SyncService } from '../../sync/application/sync.service';

@Injectable()
export class FavoriteService {
  private readonly repository = inject(FavoriteRepository);
  private readonly networkService = inject(NetworkService);
  private readonly syncService = inject(SyncService);

  constructor() {
    effect(() => {
      const pullCount = this.networkService.pullCompletedAt();
      if (pullCount > 0) {
        untracked(() => this.loadFavorites().subscribe());
      }
    });
  }

  readonly favoriteIds = signal(new Set<number>());
  loadFavorites(): Observable<RecipeSummary[]> {
    return this.repository.getMyFavorites().pipe(
      tap((favorites) => this.favoriteIds.set(new Set(favorites.map((f) => f.id)))),
    );
  }

  isFavorite(recipeId: number): boolean {
    return this.favoriteIds().has(recipeId);
  }

  addFavorite(recipeId: number): Observable<void> {
    return this.repository.addFavorite(recipeId).pipe(
      tap(() => {
        this.favoriteIds.update((ids) => new Set([...ids, recipeId]));
        this.pushIfOnline();
      }),
    );
  }

  removeFavorite(recipeId: number): Observable<void> {
    return this.repository.removeFavorite(recipeId).pipe(
      tap(() => {
        this.favoriteIds.update((ids) => { const next = new Set(ids); next.delete(recipeId); return next; });
        this.pushIfOnline();
      }),
    );
  }

  private pushIfOnline(): void {
    if (!Capacitor.isNativePlatform()) return;
    if (!this.networkService.isOnline()) return;
    this.syncService.push().catch((err) => console.error('[Sync] Error en push de favorito:', err));
  }
}
