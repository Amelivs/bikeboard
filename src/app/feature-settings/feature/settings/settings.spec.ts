import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, IonNav, ModalController } from '@ionic/angular';
import { DialogService } from 'src/app/core/services/dialog.service';
import { DataContext } from 'src/app/core/data/data-context';

import { SettingsService } from './settings.service';
import { UnlockService } from '../../../core/services/unlock.service';
import { SettingsComponent } from './settings.component';
import { AttributionsComponent } from '../attributions/attributions.component';

describe('HomeSettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let modalCtrlSpy: jasmine.SpyObj<ModalController>;
  let windowSpy: jasmine.SpyObj<Window>;
  let unlockServiceSpy: jasmine.SpyObj<UnlockService>;
  let navSpy: jasmine.SpyObj<IonNav>;
  let dialogSpy: jasmine.SpyObj<DialogService>;
  let dataContextSpy: jasmine.SpyObj<DataContext>;

  beforeEach(() => {
    modalCtrlSpy = jasmine.createSpyObj<ModalController>(['dismiss']);
    windowSpy = jasmine.createSpyObj<Window>([], {
      location: jasmine.createSpyObj<Location>(['reload'])
    });
    unlockServiceSpy = jasmine.createSpyObj<UnlockService>(['unlock']);
    navSpy = jasmine.createSpyObj<IonNav>(['push']);
    dialogSpy = jasmine.createSpyObj<DialogService>(['alert', 'confirm', 'prompt']);
    dataContextSpy = jasmine.createSpyObj<DataContext>(['reset']);

    TestBed.configureTestingModule({
      declarations: [SettingsComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        SettingsService,
        { provide: ModalController, useValue: modalCtrlSpy },
        { provide: UnlockService, useValue: unlockServiceSpy },
        { provide: IonNav, useValue: navSpy },
        { provide: Window, useValue: windowSpy },
        { provide: DialogService, useValue: dialogSpy },
        { provide: DataContext, useValue: dataContextSpy }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  describe('.constructor()', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });
  });

  // describe('.ngOnInit()', () => {
  //   it('should initialize cachedTilesCount', async () => {
  //     const count = 10;
  //     settingsServiceSpy.countCachedTiles.and.returnValue(Promise.resolve(count));
  //     await component.ngOnInit();
  //     expect(component.cachedTilesCount).toEqual(count);
  //     expect(settingsServiceSpy.countCachedTiles).toHaveBeenCalled();
  //   });
  // });

  describe('.okClick()', () => {
    it('should dismiss modal', () => {
      component.okClick();
      expect(modalCtrlSpy.dismiss).toHaveBeenCalled();
    });
  });

  describe('.attributionClick()', () => {
    it('should push AttributionsComponent', () => {
      component.attributionClick();
      expect(navSpy.push).toHaveBeenCalledWith(AttributionsComponent);
    });
  });

  describe('.unlockClick()', () => {
    it('should unlock advanced features', async () => {
      dialogSpy.prompt.and.returnValue('key123');
      await component.unlockClick();
      expect(dialogSpy.prompt).toHaveBeenCalledWith('Enter key');
      expect(unlockServiceSpy.unlock).toHaveBeenCalledWith('key123');
      expect(dialogSpy.alert).toHaveBeenCalledWith('Advanced features unlocked successfully.');
    });

    it('should handle error when unlocking advanced features', async () => {
      dialogSpy.prompt.and.returnValue('key123');
      unlockServiceSpy.unlock.and.throwError(new Error('Failed to unlock features'));
      await component.unlockClick();
      expect(unlockServiceSpy.unlock).toHaveBeenCalledWith('key123');
      expect(dialogSpy.alert).toHaveBeenCalledWith('Advanced features could not be unlocked.');
    });
  });

  describe('.resetClick()', () => {
    describe('with user confirmation', () => {
      it('should reset and reload page ', async () => {
        dialogSpy.confirm.and.returnValue(true);
        await component.resetClick();
        expect(dataContextSpy.reset).toHaveBeenCalled();
        expect(windowSpy.location.reload).toHaveBeenCalled();
      });
    });

    describe('without user confirmation', () => {
      it('should not reset', async () => {
        dialogSpy.confirm.and.returnValue(false);
        await component.resetClick();
        expect(dataContextSpy.reset).not.toHaveBeenCalled();
      });
    });
  });
});
