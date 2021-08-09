import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class BellService {

    private audioElement: HTMLAudioElement;
    private audioContext: AudioContext;

    private setupContext() {
        if (this.audioElement != null) {
            return;
        }

        this.audioElement = new Audio('assets/audio/bell.aac');

        var AudioContext = window.AudioContext || window['webkitAudioContext'];
        this.audioContext = new AudioContext();

        var gainNode = this.audioContext.createGain();
        gainNode.gain.value = 5.0;

        this.audioContext
            .createMediaElementSource(this.audioElement)
            .connect(gainNode)
            .connect(this.audioContext.destination);
    }

    public honk() {
        this.setupContext();
        this.audioElement.play();
    }
}