import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
    providedIn: 'root'
})
export class LastPositionService {

    private readonly LastPositionKey = 'LastPosition';
    private readonly initialPosition = [7.360836658509982, 48.07617984027771];

    private isValid(position: Array<number>) {
        return Array.isArray(position) &&
            position.length === 2 &&
            typeof (position[0]) === 'number' &&
            typeof (position[1]) === 'number';
    }

    public constructor(private storage: Storage) { }

    public async getLastPosition() {
        let position = await this.storage.get(this.LastPositionKey);
        if (this.isValid(position)) {
            return position as Array<number>;
        }
        return this.initialPosition;
    }

    public async setLastPosition(position: Array<number>) {
        if (this.isValid(position)) {
            console.debug('saving position', position);
            await this.storage.set(this.LastPositionKey, position);
        }
    }
}
