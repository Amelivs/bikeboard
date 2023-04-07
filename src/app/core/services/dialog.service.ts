import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  constructor(private window: Window) { }

  public alert(data: unknown) {
    let message: string;
    if (typeof data === 'string') {
      message = data;
    }
    else if (data instanceof Error) {
      message = data.message;
    }
    else {
      message = JSON.stringify(data);
    }
    this.window.alert(message);
  }

  public confirm(message: string) {
    return this.window.confirm(message);
  }

  public prompt(message: string, _default?: string) {
    return this.window.prompt(message, _default);
  }
}
