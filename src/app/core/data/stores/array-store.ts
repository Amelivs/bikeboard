import { Storage } from '@ionic/storage-angular';

import { UUID } from '../../utils/uuid';
import { Entity } from '../entities/entity';


export class ArrayStore<E extends Entity> {

    constructor(private storage: Storage, readonly storageKey: string) { }

    public async get() {
        return await this.storage.get(this.storageKey) as Promise<E[]>;
    }

    public async save(entity: E) {
        let entities: E[] = (await this.storage.get(this.storageKey) ?? []);
        if (entity.id == null) {
            entity.id = UUID.next();
        }
        let existingIndex = entities.findIndex(m => m.id === entity.id);
        if (existingIndex < 0) {
            entities.push(entity);
        }
        else {
            entities[existingIndex] = entity;
        }
        this.storage.set(this.storageKey, entities);
    }

    public async delete(entityId: string) {
        let entities: E[] = (await this.storage.get(this.storageKey) ?? []);
        let existingIndex = entities.findIndex(e => e.id === entityId);
        if (existingIndex >= 0) {
            entities.splice(existingIndex, 1);
        }
        this.storage.set(this.storageKey, entities);
    }
}
