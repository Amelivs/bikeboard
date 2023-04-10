import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';

import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  public readonly watchPosition: Observable<GeolocationPosition>;

  private createPositionWatcher() {
    return new Observable<GeolocationPosition>(observer => {
      let watchId = navigator.geolocation.watchPosition(position => {
        observer.next(position);
        this.logging.debug(`watchPosition: received coords [${position.coords.longitude},${position.coords.latitude}] `);
      }, error => {
        observer.error(error);
      }, {
        enableHighAccuracy: true
      });
      this.logging.info(`watchPosition started with id ${watchId}`);

      return () => {
        navigator.geolocation.clearWatch(watchId);
        this.logging.info(`watchPosition cleared with id ${watchId}`);
      };
    });
  }

  public constructor(private logging: LoggingService) {
    this.watchPosition = this.createPositionWatcher().pipe(share());
  }
}
