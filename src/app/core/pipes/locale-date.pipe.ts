import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'localedate'
})
export class LocaleDatePipe implements PipeTransform {

  private readonly formatter = new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric', month: 'long', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'long'
  });

  transform(date: Date): string {
    if (date == null) {
      return null;
    }
    return this.formatter.format(date);
  }
}
