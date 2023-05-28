import { Component, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { scan } from 'rxjs';
import { LogEntry, LoggingService } from 'src/app/core/services/logging.service';
import { NgIf, NgFor, NgClass, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-debugging',
  templateUrl: './debugging.component.html',
  styleUrls: ['./debugging.component.scss'],
  standalone: true,
  imports: [IonicModule, NgIf, NgFor, NgClass, AsyncPipe]
})
export class DebuggingComponent implements OnInit {

  constructor(private modalCtrl: ModalController, private loggingSrv: LoggingService) { }

  readonly logEntries$ = this.loggingSrv.logEntries.pipe(scan((acc, curr) => [...acc, curr], [] as LogEntry[]));

  ngOnInit(): void { }

  okClick() {
    this.modalCtrl.dismiss();
  }
}
