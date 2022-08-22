import { firstValueFrom, reduce, Subject } from 'rxjs';


export class ObjectStore {

  constructor(private db: IDBDatabase, readonly storeName: string) { }

  public get<Type>(id: string) {
    let result$ = new Subject<Type>();

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

  public save<Type>(id: string, value: Type) {
    let result$ = new Subject<void>();

    let request = this.db.transaction(this.storeName, 'readwrite')
      .objectStore(this.storeName)
      .put(value, id);

    request.onsuccess = () => {
      result$.next();
    };

    request.onerror = () => {
      result$.error(request.error);
    };

    return firstValueFrom(result$);
  }
}
