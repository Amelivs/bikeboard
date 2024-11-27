import { Directive, ElementRef, EventEmitter, OnDestroy, Output, inject } from '@angular/core';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { filter, map, switchMap, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[longPress]',
  standalone: true
})
export class LongPressDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private eventSubscribe: Subscription;
  threshold = 500;

  @Output() mouseLongPress = new EventEmitter<MouseEvent | TouchEvent>();

  constructor() {
    const mousedown = fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mousedown')
      .pipe(filter(event => event.button === 0));
    const touchstart = fromEvent<TouchEvent>(this.elementRef.nativeElement, 'touchstart', { passive: true });
    const touchmove = fromEvent<TouchEvent>(this.elementRef.nativeElement, 'touchmove', { passive: true });
    const touchEnd = fromEvent<TouchEvent>(this.elementRef.nativeElement, 'touchend');
    const mouseup = fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mouseup')
      .pipe(filter(event => event.button === 0));
    const mousemove = fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mousemove');

    this.eventSubscribe = merge(mousedown, touchstart)
      .pipe(switchMap(event =>
        timer(250)
          .pipe(takeUntil(merge(mouseup, mousemove, touchEnd, touchmove)))
          .pipe(map(() => event))
      ))
      .subscribe(event => this.mouseLongPress.emit(event));
  }

  ngOnDestroy(): void {
    if (this.eventSubscribe) {
      this.eventSubscribe.unsubscribe();
    }
  }
}
