import { Injectable } from '@angular/core';
import { DataContext } from 'src/app/core/data/data-context';


@Injectable({
    providedIn: 'root'
})
export class SettingsService {

    constructor(private context: DataContext) { }

    public async reset() {
        await this.context.reset();
    }

    public async countCachedTiles() {
        let keys = await caches.keys();
        let key = keys.find(k => k.includes('tiles'));
        if (!key) {
            return 0;
        }
        let tileCache = await caches.open(key);
        let elementKeys = await tileCache.keys();
        return elementKeys.length;
    }
}
