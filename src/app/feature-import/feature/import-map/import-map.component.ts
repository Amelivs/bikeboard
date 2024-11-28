import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonInput, ModalController, IonContent, IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonItem } from '@ionic/angular/standalone';
import { StyleSpecification } from 'maplibre-gl';

import { MapEntity } from '../../../core/data/entities/map';
import { DataCacheService } from '../../../core/services/data-cache.service';
import { UUID } from '../../../shared/utils/uuid';


@Component({
  selector: 'app-import-map',
  templateUrl: './import-map.component.html',
  styleUrl: './import-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IonContent, IonToolbar, IonButton, IonButtons, IonTitle, IonHeader, IonItem, IonInput]
})
export class ImportMapComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly dataCache = inject(DataCacheService);

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly form = new FormGroup({
    fileName: new FormControl<string | null>(null, [Validators.required]),
    file: new FormControl<File | null>(null, [Validators.required]),
    name: new FormControl<string | null>(null, [Validators.required])
  });

  browse() {
    this.fileInput()?.nativeElement.click();
  }

  async onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0] as File;
      let name = file.name?.split('.')[0];

      try {
        let style = JSON.parse(await file.text()) as StyleSpecification;
        if (style.name) {
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
