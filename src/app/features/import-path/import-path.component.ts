import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IonInput, ModalController } from '@ionic/angular';
import { EntityFactory } from 'src/app/core/data/entity-factory';
import { DataCacheService } from 'src/app/core/services/data-cache.service';


@Component({
  selector: 'app-import-path',
  templateUrl: './import-path.component.html',
  styleUrls: ['./import-path.component.scss'],
})
export class ImportPathComponent implements OnInit {

  @ViewChild('fileInput') set fileInput(input: IonInput) {
    input.getInputElement().then(nativeInput => {
      this.nativefileInput = nativeInput;
    });
  }

  private nativefileInput: HTMLInputElement;

  readonly form = new FormGroup({
    fileName: new FormControl(null, [Validators.required]),
    file: new FormControl(null, [Validators.required]),
    name: new FormControl(null, [Validators.required])
  });

  constructor(private modalCtrl: ModalController, private dataCache: DataCacheService) { }

  ngOnInit() { }

  browse() {
    this.nativefileInput.click();
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0] as File;
      this.form.patchValue({
        fileName: file.name,
        file,
        name: file.name?.split('.')[0]
      });
    }
  }

  okClick() {
    this.modalCtrl.dismiss();
  }

  async importClick() {
    let data = await this.toDataUrl(this.form.controls['file'].value);
    let name = this.form.controls['name'].value;

    let path = EntityFactory.createPath({
      name,
      url: data
    });

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
        reject(reader.error.message);
      }, false);
      reader.readAsDataURL(blob);
    });
  }
}
