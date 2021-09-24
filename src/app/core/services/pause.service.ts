import { Injectable } from '@angular/core';
import { fromEvent, of } from 'rxjs';
import { filter, map, switchMap, take, timeoutWith } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ScreenService {

    public readonly offDelay = 30000;

    public readonly off = fromEvent(window, 'blur')
        .pipe(switchMap(() =>
            fromEvent(window, 'focus')
                .pipe(map(() => true))
                .pipe(take(1), timeoutWith(this.offDelay, of(false)))
                .pipe(filter(reseted => !reseted))
                .pipe(map(() => { }))
        ));
}
