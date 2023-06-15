import { ErrorHandler, Injectable, Injector } from '@angular/core';

import { LoggingService } from '../services/logging.service';
import { OverlayService } from '../services/overlay.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: any) {
    const loggingSrv = this.injector.get(LoggingService);
    const overlaySrv = this.injector.get(OverlayService);

    if (error.promise && error.rejection) {
      // Promise rejection wrapped by zone.js
      error = error.rejection;
    }

    loggingSrv.error(error);
    overlaySrv.showToast(error.message);
  }
}
