import { ErrorHandler, Injectable } from '@angular/core';

import { ToastService } from '../services/toast.service';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private toastService: ToastService, private loggingSrv: LoggingService) { }

  handleError(error: any) {
    if (error.promise && error.rejection) {
      // Promise rejection wrapped by zone.js
      error = error.rejection;
    }
    this.loggingSrv.error(error);
    this.toastService.present(error.message);
  }
}
