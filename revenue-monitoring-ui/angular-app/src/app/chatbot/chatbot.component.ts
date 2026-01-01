import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { AuthenticationService } from '../providers/authentication.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-chatbot',
    templateUrl: './chatbot.component.html',
    styleUrl: './chatbot.component.css',
    imports: [
    CommonModule,
    FormsModule
  ],
  standalone: true
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  constructor(private authService: AuthenticationService) {}
  userName: string = '';
  ngOnInit(): void {
    this.userName = this.authService.getUserName();
  }
  isOpen = false;
  messages: { text: string; isUser: boolean }[] = [];
  newMessage = '';

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      const userName = this.userName || 'User';
      this.messages.push({
        text: `Hi, ${userName}! How can I help you?`,
        isUser: false,
      });
    }
  }

  sendMessage() {
    if (this.newMessage && this.newMessage.trim()) {
      this.messages.push({ text: this.newMessage, isUser: true });
      const userMsg = this.newMessage;
      this.newMessage = '';
      setTimeout(() => {
        this.messages.push({
          text: `You said: "${userMsg}". How can I assist you further?`,
          isUser: false,
        });
      }, 500);
    }
  }
}
