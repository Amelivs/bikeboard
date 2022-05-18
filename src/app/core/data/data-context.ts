import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

import { ArrayStore } from './stores/array-store';
import { MapEntity } from './entities/map';
import { ObjectStore } from './stores/object-store';
import { PathEntity } from './entities/path';
import { PreferencesEntity } from './entities/settings';
import { MigrationSteps } from './migration-steps';
import { Track } from './entities/track';


@Injectable()
export class DataContext {

    public maps: ArrayStore<MapEntity>;
    public paths: ArrayStore<PathEntity>;
    public preferences: ObjectStore<PreferencesEntity>;
    public position: ObjectStore<number[]>;
    public currentTrack: ObjectStore<Track>;

    constructor(private storageFactory: Storage) { }

    public async initialize() {
        let storage = await this.storageFactory.create();
        await this.migrate(storage);

        this.maps = new ArrayStore<MapEntity>(storage, 'maps');
        this.paths = new ArrayStore<PathEntity>(storage, 'paths');
        this.preferences = new ObjectStore<PreferencesEntity>(storage, 'preferences');
        this.position = new ObjectStore<number[]>(storage, 'position');
        this.currentTrack = new ObjectStore<Track>(storage, 'currentTrack');
    }

    public async reset() {
        let storage = await this.storageFactory.create();
        await storage.clear();
    }

    private async migrate(storage: Storage) {
        let oldVersion: number = await storage.get('version') ?? 0;
        let newVersion = MigrationSteps.length;

        let delta = newVersion - oldVersion;
        if (delta <= 0) {
            return;
        }

        console.info(`Database migration from ${oldVersion} to ${newVersion}`);

        for (let stepIndex = oldVersion; stepIndex < newVersion; stepIndex++) {
            await MigrationSteps[stepIndex](storage);
            await storage.set('version', stepIndex + 1);

            console.info(`Database migration to ${stepIndex + 1} successful`);
        }
    }
}
