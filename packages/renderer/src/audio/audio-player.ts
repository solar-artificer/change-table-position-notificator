class AudioPlayer {
  private audio: HTMLAudioElement;

  constructor(audioSource: string) {
    this.audio = new Audio(audioSource);
  }

  play(): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const callback = () => {
        this.audio.removeEventListener('ended', callback);
        this.audio.removeEventListener('pause', callback);
        resolve();
      };

      this.audio.addEventListener('ended', callback);
      this.audio.addEventListener('pause', callback);
      await this.audio.play();
    })
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

export default AudioPlayer;
