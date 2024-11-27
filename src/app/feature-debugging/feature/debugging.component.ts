import { Component, OnInit, inject } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { scan } from 'rxjs';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';

import { LogEntry, LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-debugging',
  templateUrl: './debugging.component.html',
  styleUrl: './debugging.component.scss',
  standalone: true,
  imports: [IonicModule, NgIf, NgFor, NgClass, AsyncPipe]
})
export class DebuggingComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly loggingSrv = inject(LoggingService);

  readonly logEntries$ = this.loggingSrv.logEntries.pipe(scan((acc, curr) => [...acc, curr], [] as LogEntry[]));

  ngOnInit(): void { }

  okClick() {
    this.modalCtrl.dismiss();
  }
}
