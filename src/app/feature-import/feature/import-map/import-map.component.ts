import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IonInput, ModalController } from '@ionic/angular';
import { StyleSpecification } from 'maplibre-gl';
import { MapEntity } from 'src/app/core/data/entities/map';
import { DataCacheService } from 'src/app/core/services/data-cache.service';
import { UUID } from 'src/app/shared/utils/uuid';


@Component({
  selector: 'app-import-map',
  templateUrl: './import-map.component.html',
  styleUrls: ['./import-map.component.scss'],
})
export class ImportMapComponent implements OnInit {

  @ViewChild('fileInput') set fileInput(input: IonInput) {
    input.getInputElement().then(nativeInput => {
      this.nativefileInput = nativeInput;
    });
  }

  private nativefileInput: HTMLInputElement | nil;

  readonly form = new FormGroup({
    fileName: new FormControl<string | null>(null, [Validators.required]),
    file: new FormControl<File | null>(null, [Validators.required]),
    name: new FormControl<string | null>(null, [Validators.required])
  });

  constructor(private modalCtrl: ModalController, private dataCache: DataCacheService) { }

  ngOnInit() { }

  browse() {
    this.nativefileInput?.click();
  }

  async onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0] as File;
      let name = file.name?.split('.')[0];

      try {
        let style = JSON.parse(await file.text()) as StyleSpecification;
        if (!!style.name) {
          name = style.name;
        }
      }
      catch { }

      this.form.patchValue({
        fileName: file.name,
        file,
        name
      });
    }
  }

  okClick() {
    this.modalCtrl.dismiss();
  }

  async importClick() {
    let styleUrl = await this.toDataUrl(this.form.controls['file'].value!);
    let name = this.form.controls['name'].value!;

    let map: MapEntity = {
      id: UUID.next(),
      name,
      styleUrl
    };

    await this.dataCache.saveMap(map);
    this.modalCtrl.dismiss();
  }

  private async toDataUrl(file: File) {
    let blob = new Blob([file], { type: 'application/json' });
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        resolve(reader.result as string);
      }, false);
      reader.addEventListener('error', () => {
        reject(reader.error?.message);
      }, false);
      reader.readAsDataURL(blob);
    });
  }
}
