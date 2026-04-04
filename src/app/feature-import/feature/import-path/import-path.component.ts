import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonInput, ModalController, IonContent, IonHeader, IonToolbar, IonButton, IonButtons, IonTitle, IonItem } from '@ionic/angular/standalone';

import { PathEntity } from '../../../core/data/entities/path';
import { DataCacheService } from '../../../core/services/data-cache.service';
import { UUID } from '../../../shared/utils/uuid';


@Component({
  selector: 'app-import-path',
  templateUrl: './import-path.component.html',
  styleUrl: './import-path.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IonContent, IonToolbar, IonButton, IonButtons, IonTitle, IonHeader, IonItem, IonInput]
})
export class ImportPathComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly dataCache = inject(DataCacheService);

  readonly form = new FormGroup({
    file: new FormControl<File | null>(null, [Validators.required]),
    name: new FormControl<string | null>(null, [Validators.required])
  });

  onFileChange(target: HTMLInputElement) {
    const file = target.files?.[0]
    if (file) {
      this.form.patchValue({
        file,
        name: file.name?.split('.')[0]
      });
    }
  }

  okClick() {
    this.modalCtrl.dismiss();
  }

  async importClick() {
    let data = await this.toDataUrl(this.form.controls['file'].value!);
    let name = this.form.controls['name'].value!;

    let path: PathEntity = {
      id: UUID.next(),
      name,
      url: data
    };

    await this.dataCache.savePath(path);
    this.modalCtrl.dismiss();
  }

  private async toDataUrl(file: File) {
    let blob = new Blob([file], { type: 'application/gpx+xml' });
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
