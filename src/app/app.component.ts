import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameCanvasComponent } from './components/game-canvas.component';
import { PosseService } from './services/posse.service';
import { NetworkService } from './services/network.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, GameCanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  posseService = inject(PosseService);
  networkService = inject(NetworkService);

  posseMembers$ = this.posseService.getPosseMembers();
  connectedPeers$ = this.networkService.getPeers();
  currentPlayerId?: string;

  ngOnInit() {
    this.currentPlayerId = this.networkService.getSelfId();
    // Subscribe to network messages
    this.networkService.onMessage((message, peerId) => {
      console.log('Received message:', message, 'from peer:', peerId);
    });
  }
}
