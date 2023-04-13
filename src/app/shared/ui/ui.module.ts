import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DistancePipe } from './pipes/distance.pipe';
import { DurationPipe } from './pipes/duration.pipe';
import { FixedPipe } from './pipes/fixed.pipe';
import { KilometerPipe } from './pipes/kilometer.pipe';
import { LocaleDatePipe } from './pipes/locale-date.pipe';
import { LongPressDirective } from './directives/long-press';


@NgModule({
  declarations: [
    DistancePipe,
    DurationPipe,
    FixedPipe,
    KilometerPipe,
    LocaleDatePipe,
    LongPressDirective
  ],
  exports: [
    DistancePipe,
    DurationPipe,
    FixedPipe,
    KilometerPipe,
    LocaleDatePipe,
    LongPressDirective
  ],
  imports: [
    CommonModule
  ]
})
export class SharedUiModule { }
