import { Injectable } from '@angular/core';
import { fromEvent } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  private wakeLock: WakeLockSentinel | nil;

  private get wakeLockSupported() {
    return 'wakeLock' in navigator;
  }

  private async tryLockScreen() {
    if (!this.wakeLockSupported) { return; }
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      console.info('Screen wake lock successfully acquired');
    }
    catch (err) {
      console.error('Screen wake lock could not be acquired\n', err);
    }
  }

  constructor(private window: Window) {
    fromEvent(window.document, 'visibilitychange')
      .pipe(
        filter(() => window.document.visibilityState === 'visible'),
        filter(() => this.wakeLock?.released ?? false),
        switchMap(() => this.tryLockScreen()))
      .subscribe();
  }

  public lockScreen() {
    if (this.wakeLock == null || this.wakeLock.released) {
      this.tryLockScreen();
    }
  }

  public releaseScreen() {
    if (this.wakeLock != null && !this.wakeLock.released) {
      this.wakeLock.release();
      this.wakeLock = null;
    }
  }
}
