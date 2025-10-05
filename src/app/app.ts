import { Component, effect, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hearts-app');

  // Hearts collection with random positions across the viewport
  protected readonly hearts = signal<Array<{ size: number; left: number; top: number }>>([]);
  protected readonly gapPx = 40;

  // Overlay with image and music
  protected readonly showOverlay = signal(false);
  protected readonly overlayImageUrl = signal<string>('assets/mini-kama.jpg');
  private audio?: HTMLAudioElement;
  private readonly audioUrl = 'assets/tonight-music.mp3';

  constructor() {
    // Generate many hearts of different sizes
    this.generateNonOverlappingHearts(220);

    // Prepare audio lazily on first interaction
    effect((onCleanup) => {
      if (this.showOverlay()) {
        if (!this.audio) {
          this.audio = new Audio(this.audioUrl);
          this.audio.loop = true;
        }
        // Play on open; user click initiated, so should be allowed
        this.audio.play().catch(() => {
          // ignore autoplay block; user can click again
        });
        onCleanup(() => {
          // Pause when overlay hides
          this.audio?.pause();
        });
      }
    });
  }

  protected openOverlay(): void {
    this.showOverlay.set(true);
  }

  protected closeOverlay(): void {
    this.showOverlay.set(false);
  }

  private generateNonOverlappingHearts(targetCount: number): void {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const padding = 16; // keep away from edges
    const attemptsPerHeart = 40;
    const hearts: Array<{ size: number; left: number; top: number }> = [];

    for (let n = 0; n < targetCount; n++) {
      let placed = false;
      for (let attempt = 0; attempt < attemptsPerHeart && !placed; attempt++) {
        const size = Math.floor(14 + Math.random() * 28); // 14..42px
        const radius = size / 2;
        const x = padding + radius + Math.random() * (viewportWidth - 2 * (padding + radius));
        const y = padding + radius + Math.random() * (viewportHeight - 2 * (padding + radius));

        // ensure no overlap with existing hearts (distance between centers >= sum radii + gap)
        const minGap = 6; // extra space so they don't touch visually
        let overlaps = false;
        for (const h of hearts) {
          const dx = x - h.left;
          const dy = y - h.top;
          const distSq = dx * dx + dy * dy;
          const minDist = radius + h.size / 2 + minGap;
          if (distSq < minDist * minDist) {
            overlaps = true;
            break;
          }
        }
        if (!overlaps) {
          hearts.push({ size, left: x, top: y });
          placed = true;
        }
      }
    }
    this.hearts.set(hearts);
  }
}
