import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NetworkService } from '../services/network.service';

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

@Component({
  selector: 'app-chat-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container" [class.minimized]="isMinimized">
      <div class="chat-header" (click)="toggleMinimize()">
        Chat {{ isMinimized ? '▲' : '▼' }}
      </div>
      <div class="chat-content">
        <div class="messages" #messagesContainer>
          <div *ngFor="let msg of messages" class="message">
            <span class="sender">{{ networkService.getPeerName(msg.sender) }}:</span>
            <span class="text">{{ msg.text }}</span>
          </div>
        </div>
        <div class="input-area">
          <input
            #chatInput
            [(ngModel)]="currentMessage"
            (keyup.enter)="sendMessage()"
            placeholder="Type a message..."
          />
          <button (click)="sendMessage()">Send</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './chat-overlay.component.css'
})
export class ChatOverlayComponent implements OnInit {
  networkService = inject(NetworkService);
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;
  
  messages: ChatMessage[] = [];
  currentMessage = '';
  isMinimized = false;

  ngOnInit() {
    this.networkService.onMessage((message, peerId) => {
      if (message.type === 'chat') {
        this.messages.push({
          sender: peerId,
          text: message.data.text,
          timestamp: Date.now()
        });
        this.scrollToBottom();
      }
    });
  }

  async sendMessage() {
    if (!this.currentMessage.trim()) return;
    
    const message = {
      type: 'chat',
      data: { text: this.currentMessage }
    };
    
    await this.networkService.sendMessage(message);
    
    this.messages.push({
      sender: this.networkService.getSelfId(),
      text: this.currentMessage,
      timestamp: Date.now()
    });
    
    this.currentMessage = '';
    this.scrollToBottom();
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }

  private scrollToBottom() {
    setTimeout(() => {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    });
  }
}
