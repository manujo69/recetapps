import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { SyncService } from '../../sync/application/sync.service';
import { AuthService } from '../../auth/application/auth.service';
import { NetworkPlugin } from './network-plugin';
import { AppPlugin } from './app-plugin';

@Injectable()
export class NetworkService implements OnDestroy {
  private readonly syncService = inject(SyncService);
  private readonly authService = inject(AuthService);
  private readonly networkPlugin = inject(NetworkPlugin);
  private readonly appPlugin = inject(AppPlugin);

  /** Reactive signal with the current connectivity state. Use in templates. */
  readonly isOnline = signal<boolean>(true);

  /** Increments after each successful pull. Services can react to reload their local state. */
  readonly pullCompletedAt = signal<number>(0);

  private networkListenerHandle: PluginListenerHandle | null = null;
  private appStateListenerHandle: PluginListenerHandle | null = null;
  private syncing = false;

  async initialize(): Promise<void> {
    const status = await this.networkPlugin.getStatus();
    this.isOnline.set(status.connected);

    this.networkListenerHandle = await this.networkPlugin.addListener('networkStatusChange', async (status) => {
      const wasOffline = !this.isOnline();
      this.isOnline.set(status.connected);

      if (status.connected && wasOffline && Capacitor.isNativePlatform()) {
        await this.pullIfReady();
        await this.pushIfReady();
      }
    });

    if (Capacitor.isNativePlatform()) {
      this.appStateListenerHandle = await this.appPlugin.addListener('appStateChange', async (state) => {
        if (state.isActive) {
          await this.pullIfReady();
        } else {
          await this.pushIfReady();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.networkListenerHandle?.remove();
    this.appStateListenerHandle?.remove();
  }

  private async pullIfReady(): Promise<void> {
    if (!this.authService.isAuthenticated() || !this.isOnline()) return;
    try {
      const since = await this.syncService.getLastSyncAt();
      await this.syncService.pull(since);
      this.pullCompletedAt.update((n) => n + 1);
    } catch (err) {
      console.error('[Sync] Error en pull al volver a primer plano:', err);
    }
  }

  private async pushIfReady(): Promise<void> {
    if (this.syncing) return;
    if (!this.authService.isAuthenticated()) return;
    if (!this.isOnline()) return;
    this.syncing = true;
    try {
      await this.syncService.push();
    } catch (err) {
      console.error('[Sync] Error en push:', err);
    } finally {
      this.syncing = false;
    }
  }
}
