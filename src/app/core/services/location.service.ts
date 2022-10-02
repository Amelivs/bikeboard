import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { share } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  public readonly watchPosition: Observable<GeolocationPosition>;

  private createPositionWatcher() {
    return new Observable<GeolocationPosition>(observer => {
      let watchId = navigator.geolocation.watchPosition(position => {
        observer.next(position);
        console.debug('watchPosition: received coords ', position.coords);
      }, error => {
        observer.error(error);
      }, {
        enableHighAccuracy: true
      });
      console.info('watchPosition started with id', watchId);

      return () => {
        navigator.geolocation.clearWatch(watchId);
        console.info('watchPosition cleared  with id', watchId);
      };
    });
  }

  public constructor() {
    this.watchPosition = this.createPositionWatcher().pipe(share());
  }
}
