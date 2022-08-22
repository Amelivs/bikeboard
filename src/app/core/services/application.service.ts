import { Injectable } from '@angular/core';
import { fromEvent, of } from 'rxjs';
import { filter, map, switchMap, take, timeout, timeoutWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  public readonly offDelay = 30000;

  public readonly pause = fromEvent(window, 'blur')
    .pipe(switchMap(() =>
      fromEvent(window, 'focus')
        .pipe(map(() => true))
        .pipe(take(1), timeout({ each: this.offDelay, with: () => of(false) }))
        .pipe(filter(reseted => !reseted))
        .pipe(map(() => { }))
    ));
}
