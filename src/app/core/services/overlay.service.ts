import { Injectable, Type } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {

  private currentToast: Promise<HTMLIonToastElement> | nil;

  constructor(private modalController: ModalController, private toastController: ToastController) { }

  async showModal<TComponent, TResult>(component: Type<TComponent>, componentProps?: Partial<TComponent>) {
    const modal = await this.modalController
      .create({
        component,
        componentProps
      })
    await modal.present()
    return await modal.onWillDismiss<TResult>();
  }

  async showToast(message: string) {
    await this.currentToast?.then(toast => toast.dismiss())

    this.currentToast = this.toastController.create({
      message,
      position: 'top',
      duration: 6000
    });

    let toast = await this.currentToast;
    await toast.present();
    return await toast.onWillDismiss();
  }
}
