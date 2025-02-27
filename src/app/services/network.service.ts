import { Injectable, signal } from '@angular/core';
import { joinRoom, Room, selfId } from 'trystero';
import { BehaviorSubject } from 'rxjs';

export interface PeerMessage {
  [key: string]: string | number | boolean | null | object;
  type: string;
  data: any;
}

export interface PeerInfo {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private room?: Room;
  private peerNames = new Map<string, string>();
  private peerAudios: { [key: string]: HTMLAudioElement } = {};
  private localStream?: MediaStream;
  
  readonly peers = signal<string[]>([]);
  readonly message = signal<{message: PeerMessage, peerId: string} | null>(null);
  readonly messages = signal<{message: PeerMessage, peerId: string}[]>([]);
  readonly voiceChatEnabled = signal(false);
  readonly isMicrophoneMuted = signal(false);
  readonly isIncomingAudioEnabled = signal(true);

  constructor() {
    this.initializeNetwork();
  }

  private async initializeNetwork() {
    const config = {
      appId: 'no.brainbox.pixelworld',
      relayUrls: ['wss://relay.angor.io'],
    //   trackerUrls: [
    //     'wss://tracker.openwebtorrent.com',
    //     'wss://tracker.btorrent.xyz',
    //     'wss://tracker.files.fm:7073/announce',
    //   ]
    };

    this.room = joinRoom(config, 'main-room');

    // Handle peer connections
    this.room.onPeerJoin(async (peerId) => {
      this.peers.update(current => [...current, peerId]);
      
      // Send our name to the new peer
      await this.sendMessage({
        type: 'peer-name',
        data: { name: `Player ${Math.floor(Math.random() * 1000)}` }
      });
      
      console.log('Peer joined:', peerId);
    });

    this.room.onPeerLeave((peerId) => {
      this.peers.update(current => current.filter(id => id !== peerId));
      console.log('Peer left:', peerId);
    });

    // Setup message handling
    const [_, receive] = this.room.makeAction('message');
    receive((message, peerId) => {
      const parsedMessage = JSON.parse(message as string) as PeerMessage;
      const messageData = { message: parsedMessage, peerId };
      this.message.set(messageData);
      this.messages.update(current => [...current, messageData]);
    });
  }

  async sendMessage(message: PeerMessage) {
    if (!this.room) return;
    
    const [send] = this.room.makeAction('message');
    await send([JSON.stringify(message)]);
    
    const messageData = { message, peerId: this.getSelfId() };
    this.message.set(messageData);
    this.messages.update(current => [...current, messageData]);
  }

  async enableVoiceChat() {
    if (!this.room) return;
    
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Reset mute state when enabling
      this.isMicrophoneMuted.set(false);
      this.isIncomingAudioEnabled.set(true);

      this.room.addStream(this.localStream);
      this.room.onPeerJoin(peerId => {
        if (this.localStream) {
          this.room?.addStream(this.localStream, peerId);
        }
      });

      this.room.onPeerStream((stream, peerId) => {
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        this.peerAudios[peerId] = audio;
      });

      this.voiceChatEnabled.set(true);
    } catch (error) {
      console.error('Failed to enable voice chat:', error);
    }
  }

  async disableVoiceChat() {
    this.localStream?.getTracks().forEach(track => track.stop());
    this.localStream = undefined;
    
    Object.values(this.peerAudios).forEach(audio => {
      audio.srcObject = null;
      audio.remove();
    });
    this.peerAudios = {};
    
    this.voiceChatEnabled.set(false);
  }

  async toggleMicrophone() {
    if (!this.localStream) return;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    
    this.isMicrophoneMuted.update(muted => !muted);
  }

  toggleIncomingAudio(enabled: boolean) {
    Object.values(this.peerAudios).forEach(audio => {
      audio.muted = !enabled;
    });
    
    this.isIncomingAudioEnabled.set(enabled);
  }

  getSelfId() {
    return selfId;
  }

  getPeerName(peerId: string): string {
    return this.peerNames.get(peerId) || 'Unknown Player';
  }

  setPeerName(peerId: string, name: string) {
    this.peerNames.set(peerId, name);
  }
}
