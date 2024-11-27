import { Injectable, Type, inject } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  private readonly modalController = inject(ModalController);
  private readonly toastController = inject(ToastController);

  private currentToast: Promise<HTMLIonToastElement> | nil;

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
