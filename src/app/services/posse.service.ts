import { Injectable } from '@angular/core';
import { Person } from '../interfaces/person.interface';
import { BehaviorSubject } from 'rxjs';
import { NetworkService } from './network.service';

@Injectable({
  providedIn: 'root'
})
export class PosseService {
  private posseMembers = new BehaviorSubject<Person[]>([]);

  constructor(private networkService: NetworkService) {
    this.initializePosse();
  }

  private initializePosse() {
    // Listen for peer updates
    this.networkService.getPeers().subscribe(peers => {
      const members: Person[] = peers.map(peerId => ({
        id: peerId,
        name: this.networkService.getPeerName(peerId),
        level: 1,
        avatar: 'assets/avatars/default.png'
      }));
      this.posseMembers.next(members);
    });

    // Listen for name updates
    this.networkService.onMessage((message, peerId) => {
      if (message.type === 'peer-name') {
        this.networkService.setPeerName(peerId, message.data.name);
        this.updatePosseMembers();
      }
    });
  }

  private updatePosseMembers() {
    const currentMembers = this.posseMembers.value;
    const updatedMembers = currentMembers.map(member => ({
      ...member,
      name: this.networkService.getPeerName(member.id)
    }));
    this.posseMembers.next(updatedMembers);
  }

  getPosseMembers() {
    return this.posseMembers.asObservable();
  }
}
