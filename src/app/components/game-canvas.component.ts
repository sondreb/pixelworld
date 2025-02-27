import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-game-canvas',
  standalone: true,
  template: '<canvas #gameCanvas></canvas>',
  styles: [`
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class GameCanvasComponent implements OnInit {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private gl: WebGLRenderingContext | null = null;

  ngOnInit() {
    // Initialize WebGL in ngAfterViewInit
  }

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    this.gl = canvas.getContext('webgl');
    
    if (this.gl) {
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }
}
