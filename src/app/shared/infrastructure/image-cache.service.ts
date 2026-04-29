import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ImageCacheService {
  private static readonly CACHE_NAME = 'recipe-images-v1';
  private readonly blobUrls = new Map<string, string>();
  private readonly inFlight = new Map<string, Promise<string>>();

  async getCachedUrl(remoteUrl: string): Promise<string | null> {
    const existing = this.blobUrls.get(remoteUrl);
    if (existing) return existing;

    if (!('caches' in window)) return null;

    const cache = await caches.open(ImageCacheService.CACHE_NAME);
    const response = await cache.match(remoteUrl);
    if (!response) return null;

    const blob = await response.blob();
    if (!blob.size) return null;

    const blobUrl = URL.createObjectURL(blob);
    this.blobUrls.set(remoteUrl, blobUrl);
    return blobUrl;
  }

  async fetchAndCache(remoteUrl: string): Promise<string> {
    const existing = this.blobUrls.get(remoteUrl);
    if (existing) return existing;

    if (!('caches' in window)) return remoteUrl;

    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    this.blobUrls.set(remoteUrl, blobUrl);

    const cache = await caches.open(ImageCacheService.CACHE_NAME);
    await cache.put(remoteUrl, new Response(blob, { status: 200, headers: response.headers }));

    return blobUrl;
  }

  preCacheInBackground(remoteUrl: string): void {
    if (this.inFlight.has(remoteUrl) || this.blobUrls.has(remoteUrl)) return;

    const promise = this.fetchAndCache(remoteUrl)
      .catch((err) => console.error('[ImageCache] Error al cachear imagen en background:', err))
      .finally(() => this.inFlight.delete(remoteUrl)) as Promise<string>;

    this.inFlight.set(remoteUrl, promise);
  }
}
