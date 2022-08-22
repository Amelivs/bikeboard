import { Injectable } from '@angular/core';

import { DataCacheService } from './data-cache.service';

@Injectable({
  providedIn: 'root'
})
export class UnlockService {

  public constructor(private dataCache: DataCacheService) { }

  public async unlock(masterKey: string) {
    let seedingData = await this.decryptData(masterKey);
    for (let map of seedingData.defaultMaps) {
      await this.dataCache.saveMap(map);
    }
  }

  private async decryptData(masterKey: string) {
    let data = await fetch('assets/advanced.bin').then(res => res.arrayBuffer());
    let rawKey = this.base64StringToArrayBuffer(masterKey);
    let key = await crypto.subtle.importKey('raw', rawKey, 'AES-CTR', false, ['decrypt']);

    let decrypted = await crypto.subtle.decrypt({
      name: 'AES-CTR',
      counter: new ArrayBuffer(16),
      length: 128,
    }, key, data);

    let decoder = new TextDecoder();
    let jsonData = decoder.decode(decrypted);
    return JSON.parse(jsonData);
  }

  private base64StringToArrayBuffer(b64str: string) {
    let byteStr = atob(b64str);
    let bytes = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) {
      bytes[i] = byteStr.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
