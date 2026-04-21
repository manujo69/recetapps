import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { SyncService } from '../../sync/application/sync.service';
import { AuthService } from '../../auth/application/auth.service';
import { NetworkPlugin } from './network-plugin';

@Injectable()
export class NetworkService implements OnDestroy {
  private readonly syncService = inject(SyncService);
  private readonly authService = inject(AuthService);
  private readonly networkPlugin = inject(NetworkPlugin);

  /** Reactive signal with the current connectivity state. Use in templates. */
  readonly isOnline = signal<boolean>(true);

  private listenerHandle: PluginListenerHandle | null = null;
  private syncing = false;

  async initialize(): Promise<void> {
    const status = await this.networkPlugin.getStatus();
    this.isOnline.set(status.connected);

    this.listenerHandle = await this.networkPlugin.addListener('networkStatusChange', async (status) => {
      const wasOffline = !this.isOnline();
      this.isOnline.set(status.connected);

      if (status.connected && wasOffline && Capacitor.isNativePlatform()) {
        await this.pushOnReconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.listenerHandle?.remove();
  }

  private async pushOnReconnect(): Promise<void> {
    if (this.syncing || !this.authService.isAuthenticated()) return;
    this.syncing = true;
    try {
      await this.syncService.push();
    } catch {
      // Sync failure on reconnect is non-fatal — will retry on next reconnect
    } finally {
      this.syncing = false;
    }
  }
}
