import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { firstValueFrom, Subject } from 'rxjs';

import { MapEntity } from './entities/map';
import { PathEntity } from './entities/path';
import { Activity } from './entities/activity';
import { MigrationSteps } from './migration-steps';
import { ObjectStore } from './stores/object-store';
import { TableStore } from './stores/table-store';
import { UpgradeSteps } from './upgrade-steps';


@Injectable()
export class DataContext {

  private readonly databaseName = 'bikeboard';
  private readonly versionNumber = 1;
  private database!: IDBDatabase;

  private version!: ObjectStore;

  public maps!: TableStore<MapEntity>;
  public paths!: TableStore<PathEntity>;
  public preferences!: ObjectStore;
  public activities!: TableStore<Activity>;

  constructor(private storageFactory: Storage) { }

  public async initialize() {
    this.database = await this.openDatabase();

    this.version = new ObjectStore(this.database, 'version');
    this.preferences = new ObjectStore(this.database, 'preferences');
    this.maps = new TableStore<MapEntity>(this.database, 'maps');
    this.paths = new TableStore<PathEntity>(this.database, 'paths');
    this.activities = new TableStore<Activity>(this.database, 'activities');

    let storage = await this.storageFactory.create();
    await this.useNewStorage(storage);
    await this.migrate(storage);
  }

  public async reset() {
    let storage = await this.storageFactory.create();
    await storage.clear();

    let result$ = new Subject<void>();

    this.database.close();
    let request = indexedDB.deleteDatabase(this.databaseName);

    request.onblocked = () => {
      result$.error(new Error('Database cannot be deleted'));
    };

    request.onsuccess = () => {
      result$.next();
    };

    request.onerror = () => {
      result$.error(request.error);
    };

    return firstValueFrom(result$);
  }

  private async useNewStorage(storage: Storage) {
    let version = await this.version.get<number>('version');
    if (version != null) {
      return;
    }
    version = await storage.get('version') ?? 0;
    await this.version.save('version', version);
  }

  private upgrade(db: IDBDatabase, oldVersion: number, newVersion: number) {
    let delta = newVersion - oldVersion;
    if (delta <= 0) {
      return;
    }

    console.info(`Database upgrade from ${oldVersion} to ${newVersion}`);

    for (let stepIndex = oldVersion; stepIndex < newVersion; stepIndex++) {
      UpgradeSteps[stepIndex](db);
      console.info(`Database upgrade to ${stepIndex + 1} successful`);
    }
  }

  private async migrate(storage: Storage) {
    let oldVersion = await this.version.get<number>('version') ?? 0;
    let newVersion = MigrationSteps.length;

    let delta = newVersion - oldVersion;
    if (delta <= 0) {
      return;
    }

    console.info(`Database migration from ${oldVersion} to ${newVersion}`);

    for (let stepIndex = oldVersion; stepIndex < newVersion; stepIndex++) {
      await MigrationSteps[stepIndex](storage, this.database);
      await this.version.save('version', stepIndex + 1);

      console.info(`Database migration to ${stepIndex + 1} successful`);
    }
  }

  private openDatabase() {
    let result$ = new Subject<IDBDatabase>();

    let request = indexedDB.open(this.databaseName, this.versionNumber);

    request.onupgradeneeded = event => {
      this.upgrade(request.result, event.oldVersion, event.newVersion!);
    };

    request.onsuccess = () => {
      result$.next(request.result);
    };

    request.onerror = () => {
      result$.error(request.error);
    };

    return firstValueFrom(result$);
  }
}
