import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameCanvasComponent } from './components/game-canvas.component';
import { ChatOverlayComponent } from './components/chat-overlay.component';
import { PosseService } from './services/posse.service';
import { NetworkService } from './services/network.service';
import { VideoOverlayComponent } from './components/video-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, GameCanvasComponent, ChatOverlayComponent, VideoOverlayComponent],
  template: `
    <div class="game-container">
      <aside class="sidebar">
        <div class="posse-list">
          <h2>Your Posse</h2>
          @for (person of posseMembers(); track person.id) {
            <div class="person" [class.current-player]="person.id === currentPlayerId">
              <img [src]="person.avatar" [alt]="person.name" class="avatar">
              <div class="person-info">
                <div class="name">{{person.name}}</div>
                <div class="level">Level {{person.level}}</div>
              </div>
            </div>
          }
        </div>
      </aside>
      <main class="game-area">
        <app-game-canvas></app-game-canvas>
        <app-chat-overlay></app-chat-overlay>
        <app-video-overlay></app-video-overlay>
      </main>
    </div>
    <router-outlet />
  `,
  styleUrl: './app.component.css'
})
export class AppComponent {
  private posseService = inject(PosseService);
  private networkService = inject(NetworkService);

  readonly posseMembers = this.posseService.getPosseMembers();
  readonly connectedPeers = this.networkService.peers();
  readonly currentPlayerId = this.networkService.getSelfId();
}
