import { ErrorHandler, Injectable } from '@angular/core';

import { ToastService } from '../services/toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private toastService: ToastService) { }

  handleError(error: any) {
    if (error.promise && error.rejection) {
      // Promise rejection wrapped by zone.js
      error = error.rejection;
    }
    this.toastService.present(error.message);
  }
}
