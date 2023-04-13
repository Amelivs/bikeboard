import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'fixed' })
export class FixedPipe implements PipeTransform {

  transform(value: number | nil, fractionDigits?: number) {
    return value?.toFixed(fractionDigits) ?? '-';
  }
}
