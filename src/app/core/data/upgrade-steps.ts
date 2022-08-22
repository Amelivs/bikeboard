export type UpgradeStep = (db: IDBDatabase) => void;

export const UpgradeSteps: ReadonlyArray<UpgradeStep> = [
  db => {
    db.createObjectStore('version');
    db.createObjectStore('preferences');
    db.createObjectStore('maps', { autoIncrement: true, keyPath: 'id' });
    db.createObjectStore('paths', { autoIncrement: true, keyPath: 'id' });
    db.createObjectStore('activities', { autoIncrement: true, keyPath: 'id' });
  }
];
