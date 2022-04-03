import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

import { ArrayStore } from './stores/array-store';
import { MapEntity } from './entities/map';
import { ObjectStore } from './stores/object-store';
import { PathEntity } from './entities/path';
import { PreferencesEntity } from './entities/settings';


@Injectable()
export class DataContext {

    public maps: ArrayStore<MapEntity>;
    public paths: ArrayStore<PathEntity>;
    public preferences: ObjectStore<PreferencesEntity>;
    public position: ObjectStore<number[]>;

    constructor(private storageFactory: Storage) { }

    public async initialize() {
        let storage = await this.storageFactory.create();
        this.maps = new ArrayStore<MapEntity>(storage, 'maps');
        this.paths = new ArrayStore<PathEntity>(storage, 'paths');
        this.preferences = new ObjectStore<PreferencesEntity>(storage, 'preferences');
        this.position = new ObjectStore<number[]>(storage, 'position');
    }
}
