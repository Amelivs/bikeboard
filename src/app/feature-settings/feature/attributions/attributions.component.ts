import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { IonContent, IonToolbar, IonButtons, IonHeader, IonBackButton, IonTitle } from '@ionic/angular/standalone';

import { DialogService } from '../../../core/services/dialog.service';
import { AttributionsService } from './attributions.service';


@Component({
  selector: 'app-attributions',
  templateUrl: './attributions.component.html',
  styleUrl: './attributions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonContent, IonToolbar, IonButtons, IonHeader, IonBackButton, IonTitle],
  providers: [AttributionsService]
})
export class AttributionsComponent implements OnInit {
  private readonly service = inject(AttributionsService);
  private readonly dialogSrv = inject(DialogService);

  readonly atttributions = signal('');

  async ngOnInit() {
    try {
      this.atttributions.set(await this.service.getAttributions());
    }
    catch (err) {
      console.error(err);
      this.dialogSrv.alert(err);
    }
  }
}
