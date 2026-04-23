import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { NetworkService } from './network.service';
import { NetworkPlugin } from './network-plugin';
import { AppPlugin } from './app-plugin';
import { SyncService } from '../../sync/application/sync.service';
import { AuthService } from '../../auth/application/auth.service';

describe('NetworkService', () => {
  let service: NetworkService;
  let mockSyncService: jasmine.SpyObj<SyncService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNetworkPlugin: jasmine.SpyObj<NetworkPlugin>;
  let mockAppPlugin: jasmine.SpyObj<AppPlugin>;
  let networkStatusCallback: ((status: { connected: boolean }) => Promise<void>) | null = null;
  const mockListenerHandle = { remove: jasmine.createSpy('remove') };

  beforeEach(() => {
    networkStatusCallback = null;
    mockListenerHandle.remove.calls.reset();

    mockNetworkPlugin = jasmine.createSpyObj<NetworkPlugin>('NetworkPlugin', ['getStatus', 'addListener']);
    mockNetworkPlugin.getStatus.and.resolveTo({ connected: true, connectionType: 'wifi' });
    mockNetworkPlugin.addListener.and.callFake((_event: string, cb: unknown) => {
      networkStatusCallback = cb as (status: { connected: boolean }) => Promise<void>;
      return Promise.resolve(mockListenerHandle);
    });

    mockAppPlugin = jasmine.createSpyObj<AppPlugin>('AppPlugin', ['addListener']);
    mockAppPlugin.addListener.and.resolveTo(mockListenerHandle);

    mockSyncService = jasmine.createSpyObj<SyncService>('SyncService', ['push', 'pull', 'syncOnLogin', 'getLastSyncAt']);
    mockSyncService.push.and.resolveTo();
    mockSyncService.pull.and.resolveTo();
    mockSyncService.getLastSyncAt.and.resolveTo(undefined);

    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'getToken', 'logout', 'restoreSession']);
    mockAuthService.isAuthenticated.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        NetworkService,
        { provide: NetworkPlugin, useValue: mockNetworkPlugin },
        { provide: AppPlugin, useValue: mockAppPlugin },
        { provide: SyncService, useValue: mockSyncService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(NetworkService);
  });

  describe('initialize()', () => {
    it('should read the current network status on init', async () => {
      await service.initialize();

      expect(mockNetworkPlugin.getStatus).toHaveBeenCalledTimes(1);
    });

    it('should set isOnline to true when connected', async () => {
      mockNetworkPlugin.getStatus.and.resolveTo({ connected: true, connectionType: 'wifi' });

      await service.initialize();

      expect(service.isOnline()).toBeTrue();
    });

    it('should set isOnline to false when disconnected', async () => {
      mockNetworkPlugin.getStatus.and.resolveTo({ connected: false, connectionType: 'none' });

      await service.initialize();

      expect(service.isOnline()).toBeFalse();
    });

    it('should register a networkStatusChange listener', async () => {
      await service.initialize();

      expect(mockNetworkPlugin.addListener).toHaveBeenCalledOnceWith('networkStatusChange', jasmine.any(Function));
    });
  });

  describe('network status change listener', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should update isOnline when network status changes to offline', async () => {
      await networkStatusCallback!({ connected: false });

      expect(service.isOnline()).toBeFalse();
    });

    it('should update isOnline when network status changes to online', async () => {
      await networkStatusCallback!({ connected: false });
      await networkStatusCallback!({ connected: true });

      expect(service.isOnline()).toBeTrue();
    });

    it('should NOT push sync on reconnect when not on native platform', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);
      mockAuthService.isAuthenticated.and.returnValue(true);

      await networkStatusCallback!({ connected: false });
      await networkStatusCallback!({ connected: true });

      expect(mockSyncService.push).not.toHaveBeenCalled();
    });

    it('should NOT push sync on reconnect when user is not authenticated', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      mockAuthService.isAuthenticated.and.returnValue(false);

      await networkStatusCallback!({ connected: false });
      await networkStatusCallback!({ connected: true });

      expect(mockSyncService.push).not.toHaveBeenCalled();
    });

    it('should push sync on reconnect when native and authenticated', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      mockAuthService.isAuthenticated.and.returnValue(true);

      await networkStatusCallback!({ connected: false });
      await networkStatusCallback!({ connected: true });

      expect(mockSyncService.push).toHaveBeenCalledTimes(1);
    });

    it('should NOT push when connection was already online (no wasOffline transition)', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      mockAuthService.isAuthenticated.and.returnValue(true);

      await networkStatusCallback!({ connected: true });

      expect(mockSyncService.push).not.toHaveBeenCalled();
    });

    it('should not throw when sync push fails on reconnect', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockSyncService.push.and.rejectWith(new Error('Sync error'));

      await networkStatusCallback!({ connected: false });

      await expectAsync(networkStatusCallback!({ connected: true })).toBeResolved();
    });

    it('should reset syncing flag after push so subsequent reconnects work', async () => {
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      mockAuthService.isAuthenticated.and.returnValue(true);

      await networkStatusCallback!({ connected: false });
      await networkStatusCallback!({ connected: true });
      await networkStatusCallback!({ connected: false });
      await networkStatusCallback!({ connected: true });

      expect(mockSyncService.push).toHaveBeenCalledTimes(2);
    });
  });

  describe('ngOnDestroy()', () => {
    it('should remove the network listener on destroy', async () => {
      await service.initialize();

      service.ngOnDestroy();

      expect(mockListenerHandle.remove).toHaveBeenCalledTimes(1);
    });

    it('should not throw if destroyed before initialize', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });

  describe('appStateChange listener', () => {
    let appStateCallback: ((state: { isActive: boolean }) => Promise<void>) | null = null;
    const mockAppListenerHandle = { remove: jasmine.createSpy('appRemove') };

    beforeEach(async () => {
      appStateCallback = null;
      mockAppListenerHandle.remove.calls.reset();
      spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);
      mockAppPlugin.addListener.and.callFake((_event: string, cb: unknown) => {
        appStateCallback = cb as (state: { isActive: boolean }) => Promise<void>;
        return Promise.resolve(mockAppListenerHandle);
      });
      await service.initialize();
    });

    it('should register an appStateChange listener on native platform', () => {
      expect(mockAppPlugin.addListener).toHaveBeenCalledOnceWith('appStateChange', jasmine.any(Function));
    });

    it('should call pull sync when app comes to foreground', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      await appStateCallback!({ isActive: true });

      expect(mockSyncService.pull).toHaveBeenCalledTimes(1);
    });

    it('should call push sync when app goes to background', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);

      await appStateCallback!({ isActive: false });

      expect(mockSyncService.push).toHaveBeenCalledTimes(1);
    });

    it('should not throw when pull fails on foreground', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockSyncService.pull.and.rejectWith(new Error('Pull error'));

      await expectAsync(appStateCallback!({ isActive: true })).toBeResolved();
    });

    it('should not push when device is offline', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      await networkStatusCallback!({ connected: false });

      await appStateCallback!({ isActive: false });

      expect(mockSyncService.push).not.toHaveBeenCalled();
    });

    it('should guard against concurrent pushes', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      let resolvePush!: () => void;
      mockSyncService.push.and.returnValue(new Promise<void>((r) => { resolvePush = r; }));

      const firstPush = appStateCallback!({ isActive: false });
      await appStateCallback!({ isActive: false });

      expect(mockSyncService.push).toHaveBeenCalledTimes(1);

      resolvePush();
      await firstPush;
    });

    it('should remove the appStateListenerHandle on destroy', () => {
      service.ngOnDestroy();

      expect(mockAppListenerHandle.remove).toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT register an appStateChange listener on non-native platform', async () => {
    spyOn(Capacitor, 'isNativePlatform').and.returnValue(false);

    await service.initialize();

    expect(mockAppPlugin.addListener).not.toHaveBeenCalled();
  });
});
