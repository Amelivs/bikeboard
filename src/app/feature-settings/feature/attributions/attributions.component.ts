import { Component, OnInit, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { DialogService } from '../../../core/services/dialog.service';
import { AttributionsService } from './attributions.service';

@Component({
  selector: 'app-attributions',
  templateUrl: './attributions.component.html',
  styleUrl: './attributions.component.scss',
  providers: [AttributionsService],
  standalone: true,
  imports: [IonicModule]
})
export class AttributionsComponent implements OnInit {
  private readonly service = inject(AttributionsService);
  private readonly dialogSrv = inject(DialogService);

  atttributions: string | nil;

  async ngOnInit() {
    try {
      this.atttributions = await this.service.getAttributions();
    }
    catch (err) {
      console.error(err);
      this.dialogSrv.alert(err);
    }
  }
}
