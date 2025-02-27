import { Injectable } from '@angular/core';
import { Person } from '../interfaces/person.interface';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PosseService {
  private posseMembers = new BehaviorSubject<Person[]>([
    { id: '1', name: 'John', level: 1, avatar: 'assets/avatars/default.png' },
    { id: '2', name: 'Jane', level: 2, avatar: 'assets/avatars/default.png' },
  ]);

  getPosseMembers() {
    return this.posseMembers.asObservable();
  }
}
