import { Component, computed, effect, inject, signal, ViewChild, ElementRef } from '@angular/core';
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
    <div class="chat-container" [class.minimized]="isMinimized()">
      <div class="chat-header" (click)="toggleMinimize()">
        Chat {{ isMinimized() ? '▲' : '▼' }}
        <div class="voice-controls" (click)="$event.stopPropagation()">
          <button 
            class="voice-toggle"
            [class.active]="networkService.voiceChatEnabled()"
            (click)="toggleVoiceChat($event)">
            🎤
          </button>
          <button 
            *ngIf="networkService.voiceChatEnabled()"
            class="voice-toggle"
            [class.active]="!networkService.isMicrophoneMuted()"
            (click)="toggleMicrophone($event)">
            {{ networkService.isMicrophoneMuted() ? '🔇' : '🗣️' }}
          </button>
          <button 
            *ngIf="networkService.voiceChatEnabled()"
            class="voice-toggle"
            [class.active]="networkService.isIncomingAudioEnabled()"
            (click)="toggleIncomingAudio($event)">
            {{ networkService.isIncomingAudioEnabled() ? '👂' : '🔈' }}
          </button>
        </div>
      </div>
      <div class="chat-content">
        <div class="messages" #messagesContainer>
          @for (msg of messages(); track msg.timestamp) {
            <div class="message">
              <span class="sender">{{ networkService.getPeerName(msg.sender) }}:</span>
              <span class="text">{{ msg.text }}</span>
            </div>
          }
        </div>
        <div class="input-area">
          <input
            #chatInput
            [ngModel]="currentMessage()"
            (ngModelChange)="currentMessage.set($event)"
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
export class ChatOverlayComponent {
  networkService = inject(NetworkService);
  
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('chatInput') chatInput!: ElementRef;
  
  readonly isMinimized = signal(false);
  readonly currentMessage = signal('');
  readonly messages = signal<ChatMessage[]>([]);

  constructor() {
    // Setup effect to watch for new network messages
    effect(() => {
      const networkMessages = this.networkService.messages();
      const lastMessage = networkMessages[networkMessages.length - 1];
      
      if (lastMessage?.message.type === 'chat') {
        this.messages.update(current => [...current, {
          sender: lastMessage.peerId,
          text: lastMessage.message.data.text,
          timestamp: Date.now()
        }]);
        
        this.scrollToBottom();
      }
    });
  }

  async sendMessage() {
    const text = this.currentMessage().trim();
    if (!text) return;
    
    await this.networkService.sendMessage({
      type: 'chat',
      data: { text }
    });
    
    this.currentMessage.set('');
  }

  toggleMinimize() {
    this.isMinimized.update(v => !v);
  }

  async toggleVoiceChat(event: MouseEvent) {
    event.stopPropagation();
    
    if (this.networkService.voiceChatEnabled()) {
      await this.networkService.disableVoiceChat();
    } else {
      await this.networkService.enableVoiceChat();
    }
  }

  async toggleMicrophone(event: MouseEvent) {
    event.stopPropagation();
    await this.networkService.toggleMicrophone();
  }

  toggleIncomingAudio(event: MouseEvent) {
    event.stopPropagation();
    this.networkService.toggleIncomingAudio(!this.networkService.isIncomingAudioEnabled());
  }

  private scrollToBottom() {
    setTimeout(() => {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    });
  }
}
