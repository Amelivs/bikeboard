import { Component, OnInit } from '@angular/core';

import { AttributionsService } from './attributions.service';

@Component({
  selector: 'app-attributions',
  templateUrl: './attributions.component.html',
  styleUrls: ['./attributions.component.scss'],
  providers: [AttributionsService]
})
export class AttributionsComponent implements OnInit {

  atttributions: string;

  constructor(private service: AttributionsService) { }

  async ngOnInit() {
    try {
      this.atttributions = await this.service.getAttributions();
    }
    catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : err);
    }
  }
}
