import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { MapEntity } from 'src/app/core/data/entities/map';
import { DataCacheService } from 'src/app/core/services/data-cache.service';


@Component({
  selector: 'app-import-map',
  templateUrl: './import-map.component.html',
  styleUrls: ['./import-map.component.scss'],
})
export class ImportMapComponent implements OnInit {

  readonly form = new FormGroup({
    type: new FormControl(null, [Validators.required]),
    url: new FormControl(null, [Validators.required,]),
    name: new FormControl(null, [Validators.required])
  }, ImportMapComponent.urlValidator);

  get urlError() {
    let errors = this.form.controls['url'].errors;
    return errors ? errors['message'] : null;
  }

  constructor(private modalCtrl: ModalController, private dataCache: DataCacheService) { }

  ngOnInit() { }

  okClick() {
    this.modalCtrl.dismiss();
  }

  async importClick() {
    let map: MapEntity = {
      id: null,
      name: this.form.value.name,
      attributions: null,
      layers: [{
        type: this.form.value.type,
        url: this.form.value.url
      }]
    };
    await this.dataCache.saveMap(map);
    this.modalCtrl.dismiss();
  }

  static urlValidator: ValidatorFn = (formGroup: AbstractControl) => {
    const type = formGroup.get('type');
    const url = formGroup.get('url');
    let value = url.value as string;
    if (!value) {
      return;
    }
    let inputControl = document.createElement('input');
    inputControl.type = 'url';
    inputControl.value = value;
    url.setErrors(null);
    if (!inputControl.checkValidity()) {
      url.setErrors({ message: inputControl.validationMessage });
      return null;
    }
    if (type.value === 'vector') {
      return null;
    }
    if (!value.includes('{x}') || !value.includes('{y}') || !value.includes('{z}')) {
      url.setErrors({ message: 'URL must include {X}, {y} and {z} placeholders' });
      return null;
    }
  };
}
