// src/lib/sounds.ts
export const playSound = (src: string, volume: number = 1.0) => {
  if (typeof window !== 'undefined') {
    const audio = new Audio(src);
    audio.volume = Math.max(0, Math.min(1, volume)); // Ensure volume is between 0 and 1
    audio.play().catch(error => {
      // Autoplay is often restricted by browsers, so we catch the error.
      // We don't want to show an error to the user for this.
      console.error(`Error playing sound: ${src}`, error);
    });
  }
};
