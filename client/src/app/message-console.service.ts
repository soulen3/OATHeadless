import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Message {
  timestamp: Date;
  text: string;
  type: 'info' | 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class MessageConsoleService {
  private messages = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messages.asObservable();

  addMessage(text: string, type: 'info' | 'success' | 'error' = 'info') {
    const message: Message = {
      timestamp: new Date(),
      text,
      type
    };
    
    const currentMessages = this.messages.value;
    this.messages.next([...currentMessages, message]);
  }

  clear() {
    this.messages.next([]);
  }
}
