import { Injectable } from '@angular/core';


@Injectable()
export class AttributionsService {

  constructor() { }

  async getAttributions() {
    let licenses = await this.getAsText('assets/licenses.txt');
    let thirdPartyLicenses = await this.getAsText('3rdpartylicenses.txt');
    return licenses.concat('\n\n', thirdPartyLicenses);
  }

  private async getAsText(url: string) {
    let res = await fetch(url);
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return await res.blob().then(blob => blob.text());
  }
}
