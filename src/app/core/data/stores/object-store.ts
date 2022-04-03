import { Storage } from '@ionic/storage-angular';


export class ObjectStore<E> {

    constructor(private storage: Storage, readonly storageKey: string) { }

    public async get() {
        return await this.storage.get(this.storageKey) as Promise<E>;
    }

    public async save(entity: E) {
        this.storage.set(this.storageKey, entity);
    }
}
