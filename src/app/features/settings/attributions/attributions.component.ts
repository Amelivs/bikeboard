import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-attributions',
  templateUrl: './attributions.component.html',
  styleUrls: ['./attributions.component.scss']
})
export class AttributionsComponent implements OnInit {

  credits: string;

  constructor() { }

  async ngOnInit() {
    try {
      this.credits = await this.getlicense();
    }
    catch (err) {
      console.error(err);
      alert('Attributions could not be loaded');
    }
  }

  async getlicense() {
    let otherLicense = await fetch('assets/licenses.txt');
    if (!otherLicense.ok) {
      throw new Error(otherLicense.statusText);
    }
    let otherContent = await otherLicense.blob().then(blob => blob.text());

    let response = await fetch('3rdpartylicenses.txt');
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    let content = await response.blob().then(blob => blob.text());

    return otherContent.concat('\n\n', content);
  }
}
