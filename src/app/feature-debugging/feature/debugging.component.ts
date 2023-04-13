import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { scan } from 'rxjs';
import { LogEntry, LoggingService } from 'src/app/core/services/logging.service';

@Component({
  selector: 'app-debugging',
  templateUrl: './debugging.component.html',
  styleUrls: ['./debugging.component.scss']
})
export class DebuggingComponent implements OnInit {

  constructor(private modalCtrl: ModalController, private loggingSrv: LoggingService) { }

  readonly logEntries$ = this.loggingSrv.logEntries.pipe(scan((acc, curr) => [...acc, curr], [] as LogEntry[]));

  ngOnInit(): void { }

  okClick() {
    this.modalCtrl.dismiss();
  }
}
