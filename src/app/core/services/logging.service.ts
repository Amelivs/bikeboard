/* eslint-disable no-console */
import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {

  private readonly logEntries$ = new ReplaySubject<LogEntry>(30);

  private generateEntry(data: unknown[]) {
    let items = data.map(data => {
      if (data instanceof Error) {
        return `${data.name}: ${data.message}`;
      }
      if (typeof (data) === 'string') {
        return data;
      }
      return JSON.stringify(data);
    });
    return items.join(' ');
  }

  constructor() { }

  get logEntries() {
    return this.logEntries$.asObservable();
  }

  debug(...data: unknown[]) {
    let entry = this.generateEntry(data);
    this.logEntries$.next({ level: 'Debug', value: entry });
    console.debug.apply(null, data);
  }

  info(...data: unknown[]) {
    let entry = this.generateEntry(data);
    this.logEntries$.next({ level: 'Info', value: entry });
    console.info.apply(null, data);
  }

  warn(...data: unknown[]) {
    let entry = this.generateEntry(data);
    this.logEntries$.next({ level: 'Warn', value: entry });
    console.warn.apply(null, data);
  }

  error(...data: unknown[]) {
    let entry = this.generateEntry(data);
    this.logEntries$.next({ level: 'Error', value: entry });
    console.error.apply(null, data);
  }
}

export type LogLevel = 'Debug' | 'Info' | 'Warn' | 'Error';

export type LogEntry = {
  readonly level: LogLevel;
  readonly value: string;
};
