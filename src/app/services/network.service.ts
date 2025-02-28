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
  private peerVideos = new Map<string, MediaStream>();
  private localStream?: MediaStream;
  private localVideoStream?: MediaStream;
  
  readonly peers = signal<string[]>([]);
  readonly message = signal<{message: PeerMessage, peerId: string} | null>(null);
  readonly messages = signal<{message: PeerMessage, peerId: string}[]>([]);
  readonly voiceChatEnabled = signal(false);
  readonly videoChatEnabled = signal(false);
  readonly isMicrophoneMuted = signal(false);
  readonly isIncomingAudioEnabled = signal(true);
  readonly peerVideoStreams = signal<Map<string, MediaStream>>(new Map());

  constructor() {
    this.initializeNetwork();
  }

  private async initializeNetwork() {
    console.log('[Network] Initializing network with self ID:', selfId);
    
    const config = {
      appId: 'no.brainbox.pixelworld',
      relayUrls: ['wss://relay.angor.io'],
      iceServers: [
        {
          urls: 'turn:relay1.expressturn.com:3478',
          username: 'efQUQ79N77B5BNVVKF',
          credential: 'N4EAUgpjMzPLrxSS',
        },
      ],
    };

    console.log('[Network] Joining room with config:', config);
    this.room = joinRoom(config, 'main-room');

    // Handle peer connections
    this.room.onPeerJoin(async (peerId) => {
      console.log('[Network] Peer joined:', peerId);
      console.log('[Network] Current peer count:', this.peers().length + 1);
      
      this.peers.update(current => [...current, peerId]);
      
      await this.sendMessage({
        type: 'peer-name',
        data: { name: `Player ${Math.floor(Math.random() * 1000)}` }
      });
      
      console.log('[Network] Sent name to new peer:', peerId);
    });

    this.room.onPeerLeave((peerId) => {
      console.log('[Network] Peer left:', peerId);
      console.log('[Network] Peer name was:', this.getPeerName(peerId));
      this.peers.update(current => current.filter(id => id !== peerId));
      console.log('[Network] Remaining peers:', this.peers());
    });

    // Setup message handling
    const [_, receive] = this.room.makeAction('message');
    receive((message, peerId) => {
      console.log('[Network] Received message from peer:', peerId);
      console.log('[Network] Raw message:', message);
      
      try {
        const parsedMessage = JSON.parse(message as string) as PeerMessage;
        console.log('[Network] Parsed message:', parsedMessage);
        const messageData = { message: parsedMessage, peerId };
        this.message.set(messageData);
        this.messages.update(current => [...current, messageData]);
      } catch (error) {
        console.error('[Network] Failed to parse message:', error);
      }
    });

    this.room.onPeerStream((stream, peerId) => {
      console.log('[Network] Received stream from peer:', peerId);
      console.log('[Network] Stream tracks:', stream.getTracks().map(t => ({kind: t.kind, enabled: t.enabled})));

      if (stream.getVideoTracks().length > 0) {
        console.log('[Network] Processing video stream from:', peerId);
        this.peerVideos.set(peerId, stream);
        this.peerVideoStreams.set(this.peerVideos);
      } else {
        console.log('[Network] Processing audio stream from:', peerId);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.autoplay = true;
        this.peerAudios[peerId] = audio;
      }
    });
  }

  async sendMessage(message: PeerMessage) {
    if (!this.room) {
      console.warn('[Network] Attempted to send message without active room');
      return;
    }
    
    console.log('[Network] Sending message:', message);
    const [send] = this.room.makeAction('message');
    
    try {
      await send([JSON.stringify(message)]);
      console.log('[Network] Message sent successfully');
    } catch (error) {
      console.error('[Network] Failed to send message:', error);
    }
    
    const messageData = { message, peerId: this.getSelfId() };
    this.message.set(messageData);
    this.messages.update(current => [...current, messageData]);
  }

  async enableVoiceChat() {
    if (!this.room) {
      console.warn('[Network] Attempted to enable voice chat without active room');
      return;
    }
    
    console.log('[Network] Attempting to enable voice chat');
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      
      console.log('[Network] Got local audio stream:', 
        this.localStream.getTracks().map(t => ({kind: t.kind, enabled: t.enabled})));

      this.isMicrophoneMuted.set(false);
      this.isIncomingAudioEnabled.set(true);

      this.room.addStream(this.localStream);
      console.log('[Network] Added local stream to room');

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
      console.log('[Network] Voice chat enabled successfully');
    } catch (error) {
      console.error('[Network] Failed to enable voice chat:', error);
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

  async enableVideoChat() {
    if (!this.room) {
      console.warn('[Network] Attempted to enable video chat without active room');
      return;
    }
    
    console.log('[Network] Attempting to enable video chat');
    try {
      this.localVideoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log('[Network] Got local video stream:', 
        this.localVideoStream.getTracks().map(t => ({kind: t.kind, enabled: t.enabled})));

      this.room.addStream(this.localVideoStream);
      console.log('[Network] Added local video stream to room');

      this.room.onPeerJoin(peerId => {
        if (this.localVideoStream) {
          this.room?.addStream(this.localVideoStream, peerId);
        }
      });

      this.videoChatEnabled.set(true);
      console.log('[Network] Video chat enabled successfully');
    } catch (error) {
      console.error('[Network] Failed to enable video chat:', error);
    }
  }

  async disableVideoChat() {
    this.localVideoStream?.getTracks().forEach(track => track.stop());
    this.localVideoStream = undefined;
    this.videoChatEnabled.set(false);
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
    console.log('[Network] Setting peer name:', peerId, name);
    this.peerNames.set(peerId, name);
  }
}
