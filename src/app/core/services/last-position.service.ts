import { Injectable } from '@angular/core';

import { DataContext } from '../data/data-context';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root'
})
export class LastPositionService {

  private readonly initialPosition = [7.360836658509982, 48.07617984027771];

  private isValid(position: Array<number>) {
    return Array.isArray(position) &&
      position.length === 2 &&
      typeof (position[0]) === 'number' &&
      typeof (position[1]) === 'number';
  }

  public constructor(private storage: DataContext, private logging: LoggingService) { }

  public async getLastPosition() {
    let position = await this.storage.preferences.get<number[]>('position');
    if (this.isValid(position)) {
      return position as Array<number>;
    }
    return this.initialPosition;
  }

  public async setLastPosition(position: Array<number>) {
    if (this.isValid(position)) {
      this.logging.debug(`saving position`, position);
      await this.storage.preferences.save('position', position);
    }
  }
}
