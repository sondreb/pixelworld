import { Injectable, effect, signal } from '@angular/core';
import { Person } from '../interfaces/person.interface';
import { NetworkService } from './network.service';

@Injectable({
  providedIn: 'root'
})
export class PosseService {
  private posseMembers = signal<Person[]>([]);
  private currentPlayerName = `Player ${Math.floor(Math.random() * 1000)}`;

  constructor(private networkService: NetworkService) {
    this.initializePosse();
  }

  private initializePosse() {
    // Create effect to handle peer updates
    effect(() => {
      const peers = this.networkService.peers();
      
      // Current player is always included
      const currentPlayer: Person = {
        id: this.networkService.getSelfId(),
        name: this.currentPlayerName,
        level: 1,
        avatar: 'assets/avatars/default.png'
      };

      // Only create entries for currently connected peers
      const members: Person[] = peers.map(peerId => ({
        id: peerId,
        name: this.networkService.getPeerName(peerId),
        level: 1,
        avatar: 'assets/avatars/default.png'
      }));

      // Replace entire array to remove disconnected peers
      this.posseMembers.set([currentPlayer, ...members]);
    });

    // Listen for name updates using message signal
    effect(() => {
      const messageData = this.networkService.message();
      if (messageData && messageData.message.type === 'peer-name') {
        this.networkService.setPeerName(
          messageData.peerId, 
          messageData.message.data.name
        );
        this.updatePosseMembers();
      }
    });

    // Send initial name to peers
    this.networkService.sendMessage({
      type: 'peer-name',
      data: { name: this.currentPlayerName }
    });
  }

  private updatePosseMembers() {
    const currentPlayer: Person = {
      id: this.networkService.getSelfId(),
      name: this.currentPlayerName,
      level: 1,
      avatar: 'assets/avatars/default.png'
    };

    const peers = this.networkService.peers();
    const members = peers.map(peerId => ({
      id: peerId,
      name: this.networkService.getPeerName(peerId),
      level: 1,
      avatar: 'assets/avatars/default.png'
    }));

    this.posseMembers.set([currentPlayer, ...members]);
  }

  getPosseMembers() {
    return this.posseMembers;
  }
}
