import { Injectable, inject } from '@angular/core';

import { DataContext } from '../../../core/data/data-context';


@Injectable()
export class SettingsService {
  private readonly context = inject(DataContext);

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
