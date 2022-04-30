import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { EntityFactory } from 'src/app/core/data/entity-factory';
import { DataCacheService } from 'src/app/core/services/data-cache.service';


@Component({
  selector: 'app-import-map',
  templateUrl: './import-map.component.html',
  styleUrls: ['./import-map.component.scss'],
})
export class ImportMapComponent implements OnInit {

  readonly form = new FormGroup({
    url: new FormControl(null, [Validators.required, ImportMapComponent.urlValidator]),
    name: new FormControl(null, [Validators.required])
  });

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
    let map = EntityFactory.createMap({
      name: this.form.value.name,
      layers: [{
        type: 'raster',
        url: this.form.value.url
      }]
    });
    await this.dataCache.saveMap(map);
    this.modalCtrl.dismiss();
  }

  static urlValidator: ValidatorFn = (control: AbstractControl) => {
    let value = control.value as string;
    if (!value) {
      return;
    }
    let inputControl = document.createElement('input');
    inputControl.type = 'url';
    inputControl.value = value;
    if (!inputControl.checkValidity()) {
      return { message: inputControl.validationMessage };
    }
    if (!value.includes('{x}') || !value.includes('{y}') || !value.includes('{z}')) {
      return { message: 'URL must include {X}, {y} and {z} placeholders' };
    }
  };
}
