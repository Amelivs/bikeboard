import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'km',
  standalone: true
})
export class KilometerPipe implements PipeTransform {
  transform(value: number | null): string {
    if (value == null) {
      return '';
    }
    if (value < 1000) {
      return Math.round(value).toString();
    }
    if (value < 10000) {
      return (value / 1000).toFixed(2);
    }
    return (value / 1000).toFixed(1);
  }
}
