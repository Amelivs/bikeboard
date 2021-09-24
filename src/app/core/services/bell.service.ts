import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class BellService {

    private audioElement: HTMLAudioElement;
    private audioContext: AudioContext;

    private setupContext() {
        this.audioElement = new Audio('assets/audio/bell.aac');

        let AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContext();

        let gainNode = this.audioContext.createGain();
        gainNode.gain.value = 5.0;

        this.audioContext
            .createMediaElementSource(this.audioElement)
            .connect(gainNode)
            .connect(this.audioContext.destination);
    }

    public async honk() {
        this.setupContext();
        try {
            await this.audioElement.play();
        }
        catch (err) {
            this.audioElement = null;
            throw err;
        }
    }
}
