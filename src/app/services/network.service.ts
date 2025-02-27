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
  
  readonly peers = signal<string[]>([]);
  readonly message = signal<{message: PeerMessage, peerId: string} | null>(null);
  readonly messages = signal<{message: PeerMessage, peerId: string}[]>([]);

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
