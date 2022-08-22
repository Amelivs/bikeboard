import { firstValueFrom, reduce, Subject } from 'rxjs';

import { Entity } from '../entities/entity';


export class TableStore<E extends Entity> {

  constructor(private db: IDBDatabase, readonly storeName: string) { }

  public get(id: string) {
    let result$ = new Subject<E>();

    let request = this.db.transaction(this.storeName, 'readonly')
      .objectStore(this.storeName)
      .get(id);

    request.onsuccess = () => {
      result$.next(request.result);
    };

    request.onerror = () => {
      result$.error(request.error);
    };

    return firstValueFrom(result$);
  }

  public getAll() {
    let result$ = new Subject<E>();

    let request = this.db.transaction(this.storeName, 'readonly')
      .objectStore(this.storeName)
      .openCursor();

    request.onsuccess = () => {
      let cursor = request.result;
      if (cursor != null) {
        result$.next(cursor.value);
        cursor.continue();
      } else {
        result$.complete();
      }
    };

    request.onerror = () => {
      result$.error(request.error);
    };

    return firstValueFrom(result$.pipe(reduce((acc, one) => [...acc, one], [] as E[])));
  }

  public save(entity: E) {
    let result$ = new Subject<void>();

    let request = this.db.transaction(this.storeName, 'readwrite')
      .objectStore(this.storeName)
      .put(entity);

    request.onsuccess = () => {
      result$.next();
    };

    request.onerror = () => {
      result$.error(request.error);
    };

    return firstValueFrom(result$);
  }

  public delete(entityId: string) {
    let result$ = new Subject<void>();

    let request = this.db.transaction(this.storeName, 'readwrite')
      .objectStore(this.storeName)
      .delete(entityId);

    request.onsuccess = () => {
      result$.next();
    };

    request.onerror = () => {
      result$.error(request.error);
    };

    return firstValueFrom(result$);
  }
}
