import { Injectable } from '@angular/core';
import { Network, NetworkStatus } from '@capacitor/network';
import { PluginListenerHandle } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class NetworkPlugin {
  getStatus(): Promise<NetworkStatus> {
    return Network.getStatus();
  }

  addListener(
    event: 'networkStatusChange',
    callback: (status: NetworkStatus) => void,
  ): Promise<PluginListenerHandle> {
    return Network.addListener(event, callback);
  }
}
