import { Storage } from '@ionic/storage-angular';

export const MigrationSteps: ReadonlyArray<(storage: Storage) => Promise<void>> = [];
