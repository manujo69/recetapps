import { Injectable } from '@angular/core';
import { App, AppState } from '@capacitor/app';
import { PluginListenerHandle } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class AppPlugin {
  addListener(
    event: 'appStateChange',
    callback: (state: AppState) => void,
  ): Promise<PluginListenerHandle> {
    return App.addListener(event, callback);
  }
}
