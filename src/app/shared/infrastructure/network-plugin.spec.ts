import { TestBed } from '@angular/core/testing';
import { NetworkPlugin } from './network-plugin';

describe('NetworkPlugin', () => {
  let plugin: NetworkPlugin;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [NetworkPlugin] });
    plugin = TestBed.inject(NetworkPlugin);
  });

  describe('getStatus()', () => {
    it('should return a promise that resolves with a NetworkStatus object', async () => {
      const status = await plugin.getStatus();

      expect(status).toEqual(
        jasmine.objectContaining({
          connected: jasmine.any(Boolean),
          connectionType: jasmine.any(String),
        }),
      );
    });
  });

  describe('addListener()', () => {
    it('should return a promise that resolves with a removable listener handle', async () => {
      const callback = jasmine.createSpy('callback');

      const handle = await plugin.addListener('networkStatusChange', callback);

      expect(handle).toBeDefined();
      expect(typeof handle.remove).toBe('function');
      await handle.remove();
    });
  });
});
