import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MessageConsoleService, Message } from '../message-console.service';

@Component({
  selector: 'app-message-console',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './message-console.component.html',
  styleUrls: ['./message-console.component.sass'],
})
export class MessageConsoleComponent {
  messages: Message[] = [];

  constructor(private messageService: MessageConsoleService) {
    this.messageService.messages$.subscribe(messages => {
      this.messages = messages;
    });
  }

  clear() {
    this.messageService.clear();
  }
}
