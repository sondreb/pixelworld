import { Injectable } from '@angular/core';
import { joinRoom, Room, selfId } from 'trystero';
import { BehaviorSubject } from 'rxjs';

export interface PeerMessage {
  [key: string]: string | number | boolean | null | object;
  type: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private room?: Room;
  private peers = new BehaviorSubject<string[]>([]);
  
  constructor() {
    this.initializeNetwork();
  }

  private async initializeNetwork() {
    const config = {
      appId: 'no.brainbox.pixelworld',
    };

    this.room = joinRoom(config, 'main-room');

    // Handle peer connections
    this.room.onPeerJoin((peerId) => {
      const currentPeers = this.peers.value;
      this.peers.next([...currentPeers, peerId]);
      console.log('Peer joined:', peerId);
    });

    this.room.onPeerLeave((peerId) => {
      const currentPeers = this.peers.value;
      this.peers.next(currentPeers.filter(id => id !== peerId));
      console.log('Peer left:', peerId);
    });
  }

  getPeers() {
    return this.peers.asObservable();
  }

  async sendMessage(message: PeerMessage) {
    if (!this.room) return;
    
    const [send] = this.room.makeAction('message');
    await send([JSON.stringify(message)]);
  }

  onMessage(callback: (message: PeerMessage, peerId: string) => void) {
    if (!this.room) return;

    const [_, receive] = this.room.makeAction('message');
    receive((message, peerId) => {
      const parsedMessage = JSON.parse(message as string) as PeerMessage;
      callback(parsedMessage, peerId);
    });
  }

  getSelfId() {
    return selfId;
  }
}
