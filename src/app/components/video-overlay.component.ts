import { Component, ElementRef, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-video-overlay',
  standalone: true,
  imports: [CommonModule, KeyValuePipe],
  template: `
    <div class="video-container" *ngIf="networkService.videoChatEnabled()">
      <div class="video-grid" #videoGrid>
        <!-- Local video -->
        <div class="video-wrapper local-video" *ngIf="localVideoStream()">
          <video #localVideo [srcObject]="localVideoStream()" autoplay playsinline muted></video>
          <div class="peer-name">You</div>
        </div>
        <!-- Remote videos -->
        @for (entry of videoStreams() | keyvalue; track entry.key) {
          <div class="video-wrapper">
            <video #videoElement [srcObject]="entry.value" autoplay playsinline></video>
            <div class="peer-name">{{ networkService.getPeerName(entry.key) }}</div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .video-container {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 10px;
      backdrop-filter: blur(10px);
    }

    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s;
    }

    .video-wrapper:hover {
      transform: scale(1.02);
    }

    .local-video {
      border: 2px solid #00ff00;
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
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
    }

    @media (min-width: 768px) {
      .video-container {
        width: 400px;
      }
    }

    @media (min-width: 1200px) {
      .video-container {
        width: 500px;
      }
    }
  `]
})
export class VideoOverlayComponent {
  networkService = inject(NetworkService);
  @ViewChild('localVideo') localVideoElement?: ElementRef<HTMLVideoElement>;
  
  videoStreams = this.networkService.peerVideoStreams;
  localVideoStream = signal<MediaStream | null>(null);

  constructor() {
    // Watch for local video stream
    effect(() => {
      if (this.networkService.videoChatEnabled()) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => this.localVideoStream.set(stream))
          .catch(err => console.error('Failed to get local video:', err));
      } else {
        this.localVideoStream()?.getTracks().forEach(track => track.stop());
        this.localVideoStream.set(null);
      }
    });

    // Re-run when video streams change
    effect(() => {
      const streams = this.videoStreams();
      console.log('Video streams updated:', streams.size);
    });
  }
}
