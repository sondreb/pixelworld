import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameCanvasComponent } from './components/game-canvas.component';
import { ChatOverlayComponent } from './components/chat-overlay.component';
import { PosseService } from './services/posse.service';
import { NetworkService } from './services/network.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, GameCanvasComponent, ChatOverlayComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private posseService = inject(PosseService);
  private networkService = inject(NetworkService);

  readonly posseMembers = this.posseService.getPosseMembers();
  readonly connectedPeers = this.networkService.peers();
  readonly currentPlayerId = this.networkService.getSelfId();
}
