import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class StorageManagerService {

    public async estimate() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            var { usage, quota } = await navigator.storage.estimate();
            usage = Math.round(usage / (1024 * 1024));
            quota = Math.round(quota / (1024 * 1024));
            return { usage, quota };
        }
        else {
            var usage = await this.cachesSize();
            var quota: number = null;
            usage = Math.round(usage / (1024 * 1024));
            return { usage, quota };
        }
    }

    public async getCachedTilesCount() {
        let keys = await caches.keys();
        let key = keys.find(k => k.includes('tiles'));
        if (!key) {
            return 0;
        }
        let tileCache = await caches.open(key);
        let elementKeys = await tileCache.keys();
        return elementKeys.length;
    }

    private cacheSize(c: Cache) {
        return c.keys().then(a => Promise.all(
                a.map(req => c.match(req).then(res => res.clone().blob().then(b => b.size)))
            ).then(a => a.reduce((acc, n) => acc + n, 0)));
    }

    private cachesSize() {
        return caches.keys().then(a => Promise.all(
                a.map(n => caches.open(n).then(c => this.cacheSize(c)))
            ).then(a => a.reduce((acc, n) => acc + n, 0)));
    }
}
