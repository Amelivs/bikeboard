import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fixed',
  standalone: true
})
export class FixedPipe implements PipeTransform {

  transform(value: number | nil, fractionDigits?: number) {
    return value?.toFixed(fractionDigits) ?? '-';
  }
}
