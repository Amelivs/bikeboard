import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { DataCacheService } from 'src/app/core/services/data-cache.service';

import { ImportMapComponent } from './import-map.component';

describe('ImportMapComponent', () => {
  let component: ImportMapComponent;
  let fixture: ComponentFixture<ImportMapComponent>;
  let mockModalCtrl: jasmine.SpyObj<ModalController>;
  let mockDataCache: jasmine.SpyObj<DataCacheService>;

  beforeEach(waitForAsync(() => {
    mockModalCtrl = jasmine.createSpyObj<ModalController>(['dismiss']);
    mockDataCache = jasmine.createSpyObj<DataCacheService>(['saveMap']);

    TestBed.configureTestingModule({ declarations: [ImportMapComponent] })
      .overrideProvider(ModalController, { useValue: mockModalCtrl })
      .overrideProvider(DataCacheService, { useValue: mockDataCache })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImportMapComponent);
    component = fixture.componentInstance;
  });

  describe('.constructor()', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('.importClick()', () => {
    it('should save map and close modal', async () => {
      component.form.patchValue({
        fileName: 'map 1',
        file: null,
        name: 'http://test.com'
      });
      await component.importClick();
      expect(mockDataCache.saveMap).toHaveBeenCalled();
      expect(mockModalCtrl.dismiss).toHaveBeenCalled();
    });
  });
});
