import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {

  transform(timestamp: number): string {
    let seconds = timestamp / 1000;
    let hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    let minutes = Math.floor(seconds % 3600 / 60).toString().padStart(2, '0');
    return `${hours}h${minutes}`;
  }
}
