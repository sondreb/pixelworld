import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameCanvasComponent } from './components/game-canvas.component';
import { PosseService } from './services/posse.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, GameCanvasComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  posseService = inject(PosseService);

  posseMembers$ = this.posseService.getPosseMembers();

  constructor() {}
}
