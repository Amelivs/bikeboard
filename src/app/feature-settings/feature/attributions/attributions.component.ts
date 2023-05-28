import { Component, OnInit } from '@angular/core';
import { DialogService } from 'src/app/core/services/dialog.service';
import { IonicModule } from '@ionic/angular';

import { AttributionsService } from './attributions.service';

@Component({
  selector: 'app-attributions',
  templateUrl: './attributions.component.html',
  styleUrls: ['./attributions.component.scss'],
  providers: [AttributionsService],
  standalone: true,
  imports: [IonicModule]
})
export class AttributionsComponent implements OnInit {

  atttributions: string | nil;

  constructor(private service: AttributionsService, private dialogSrv: DialogService) { }

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
