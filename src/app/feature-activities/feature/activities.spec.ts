import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { firstValueFrom, skip } from 'rxjs';
import { IonItemSliding, ModalController } from '@ionic/angular';
import { Activity } from 'src/app/core/data/entities/activity';
import { DataContext } from 'src/app/core/data/data-context';
import { TableStore } from 'src/app/core/data/stores/table-store';
import { ObjectStore } from 'src/app/core/data/stores/object-store';
import { DialogService } from 'src/app/core/services/dialog.service';

import { ActivitiesComponent } from './activities.component';

describe('ActivitiesComponent', () => {
  let component: ActivitiesComponent;
  let fixture: ComponentFixture<ActivitiesComponent>;
  let mockModalCtrl: jasmine.SpyObj<ModalController>;
  let mockDataContext: jasmine.SpyObj<DataContext>;
  let dialogSrvSpy: jasmine.SpyObj<DialogService>;
  let mockActivities: jasmine.SpyObj<TableStore<Activity>> = jasmine.createSpyObj(['get', 'getAll', 'delete']);
  let mockPreferences: jasmine.SpyObj<ObjectStore> = jasmine.createSpyObj(['get']);

  beforeEach(waitForAsync(() => {
    mockModalCtrl = jasmine.createSpyObj(['dismiss']);
    dialogSrvSpy = jasmine.createSpyObj<DialogService>(['alert', 'confirm', 'prompt']);
    mockDataContext = jasmine.createSpyObj([], {
      activities: mockActivities,
      preferences: mockPreferences
    });

    TestBed.configureTestingModule({ declarations: [ActivitiesComponent] })
      .overrideProvider(ModalController, { useValue: mockModalCtrl })
      .overrideProvider(DataContext, { useValue: mockDataContext })
      .overrideProvider(DialogService, { useValue: dialogSrvSpy })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActivitiesComponent);
    component = fixture.componentInstance;
    mockActivities.delete.calls.reset();
  });

  describe('.constructor()', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('.ngOnInit()', () => {
    it('should load activities', async () => {
      let activities: Activity[] = [{ id: '1', distance: 0, duration: 4, segments: [], startDate: new Date() }];
      mockActivities.getAll.and.returnValue(Promise.resolve(activities));
      component.ngOnInit();
      await expectAsync(firstValueFrom(component.activities$.pipe(skip(1)))).toBeResolvedTo(activities);
    });
  });

  describe('.okClick()', () => {
    it('should dismiss modal', () => {
      component.okClick();
      expect(mockModalCtrl.dismiss).toHaveBeenCalled();
    });
  });

  describe('.deleteActivity(id)', () => {
    it('should delete activity', async () => {
      let activity: Activity = { id: '1', distance: 0, duration: 4, segments: [], startDate: new Date() };
      let ion = jasmine.createSpyObj<IonItemSliding>(['close']);

      mockPreferences.get.and.returnValue(Promise.resolve('0'));
      dialogSrvSpy.confirm.and.returnValue(true);

      await component.deleteActivity(ion, activity);
      expect(mockActivities.delete).toHaveBeenCalledWith('1');
      expect(ion.close).toHaveBeenCalled();
    });

    it('should not delete current activity', async () => {
      let activity: Activity = { id: '1', distance: 0, duration: 4, segments: [], startDate: new Date() };
      let ion = jasmine.createSpyObj<IonItemSliding>(['close']);

      mockPreferences.get.and.returnValue(Promise.resolve('1'));
      dialogSrvSpy.confirm.and.returnValue(true);

      await component.deleteActivity(ion, activity);
      expect(mockActivities.delete).not.toHaveBeenCalled();
      expect(ion.close).toHaveBeenCalled();
    });

    it('should not delete activity', async () => {
      let activity: Activity = { id: '1', distance: 0, duration: 4, segments: [], startDate: new Date() };
      let ion = jasmine.createSpyObj<IonItemSliding>(['close']);

      dialogSrvSpy.confirm.and.returnValue(false);

      await component.deleteActivity(ion, activity);
      expect(mockActivities.delete).not.toHaveBeenCalled();
      expect(ion.close).toHaveBeenCalled();
    });
  });

  /*
    describe("Export activity", () => {
      it('should export activity', async () => {
        let activity: Activity = { id: '1', distance: 0, duration: 4, segments: [], startDate: new Date() };
        let ion = jasmine.createSpyObj<IonItemSliding>(['close']);
        mockActivities.get.and.returnValue(Promise.resolve(activity))
        await component.shareActivity(ion, activity);
      });
    });*/
});
