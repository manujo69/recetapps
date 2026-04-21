import { TestBed } from '@angular/core/testing';
import { Capacitor } from '@capacitor/core';
import { NetworkService } from './network.service';
import { NetworkPlugin } from './network-plugin';
import { SyncService } from '../../sync/application/sync.service';
import { AuthService } from '../../auth/application/auth.service';

describe('NetworkService', () => {
  let service: NetworkService;
  let mockSyncService: jasmine.SpyObj<SyncService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockNetworkPlugin: jasmine.SpyObj<NetworkPlugin>;
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

    mockSyncService = jasmine.createSpyObj<SyncService>('SyncService', ['push', 'pull', 'syncOnLogin', 'getLastSyncAt']);
    mockSyncService.push.and.resolveTo();

    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'getToken', 'logout', 'restoreSession']);
    mockAuthService.isAuthenticated.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        NetworkService,
        { provide: NetworkPlugin, useValue: mockNetworkPlugin },
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
});
