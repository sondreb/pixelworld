import { Component, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-video-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-container" *ngIf="networkService.videoChatEnabled()">
      <div class="video-grid" #videoGrid>
        <div class="video-wrapper" *ngFor="let entry of videoStreams()">
          <video #videoElement [srcObject]="entry[1]" autoplay playsinline></video>
          <div class="peer-name">{{ networkService.getPeerName(entry[0]) }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-container {
      position: absolute;
      top: 20px;
      right: 20px;
      max-width: 300px;
    }
    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
    }
    .video-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 8px;
      overflow: hidden;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .peer-name {
      position: absolute;
      bottom: 8px;
      left: 8px;
      color: white;
      text-shadow: 0 0 4px black;
      font-size: 12px;
    }
  `]
})
export class VideoOverlayComponent {
  networkService = inject(NetworkService);
  
  videoStreams = this.networkService.peerVideoStreams;

  constructor() {
    effect(() => {
      // Re-run when video streams change
      const streams = this.videoStreams();
      console.log('Video streams updated:', streams.size);
    });
  }
}
