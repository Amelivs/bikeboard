import { Component, OnInit, inject } from '@angular/core';
import { ModalController, IonHeader, IonToolbar, IonContent, IonButton, IonButtons, IonTitle, IonList, IonItem } from '@ionic/angular/standalone';
import { scan } from 'rxjs';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';

import { LogEntry, LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-debugging',
  templateUrl: './debugging.component.html',
  styleUrl: './debugging.component.scss',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, AsyncPipe, IonHeader, IonToolbar, IonContent, IonButton, IonButtons, IonTitle, IonList, IonItem]
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
