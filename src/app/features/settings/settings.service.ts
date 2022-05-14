import { Injectable } from '@angular/core';


@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    public async estimate() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            let { usage, quota } = await navigator.storage.estimate();
            usage = Math.round(usage / (1024 * 1024));
            quota = Math.round(quota / (1024 * 1024));
            return { usage, quota };
        }
        else {
            let usage = await this.cachesSize();
            let quota: number = null;
            usage = Math.round(usage / (1024 * 1024));
            return { usage, quota };
        }
    }

    public async clearCache() {
        if (!confirm('Cached data will be lost.')) {
            return;
        }
        let deleteCount = 0;
        let cacheNames = await caches.keys();
        let tileCacheNames = cacheNames.filter(name => name.includes('tiles'));
        for (let tileCacheName of tileCacheNames) {
            let tileCache = await caches.open(tileCacheName);
            let entries = await tileCache.keys();
            for (let entry of entries) {
                let ok = await tileCache.delete(entry);
                if (ok) {
                    deleteCount += 1;
                }
            }
        }
        alert(`${deleteCount} entry(ies) successfully removed.`);
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
