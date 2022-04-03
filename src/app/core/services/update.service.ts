import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Injectable({
    providedIn: 'root'
})
export class UpdateService {

    public constructor(private updates: SwUpdate) { }

    public checkForUpdates() {
        this.updates.versionUpdates.subscribe(event => this.promptUser());
    }

    private promptUser() {
        console.info('updating to new version');
        this.updates.activateUpdate().then(() => window.location.reload());
    }
}
