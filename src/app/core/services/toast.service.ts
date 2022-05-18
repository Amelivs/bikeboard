import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
})
export class ToastService {

    constructor(private toastController: ToastController) { }

    async present(message: string) {
        const toast = await this.toastController.create({
            message,
            position: 'top',
            duration: 6000
        });
        toast.present();
    }
}
