import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../providers/authentication.service';
import {
  ChatbotPageConfig,
  getChatbotConfig,
  DEFAULT_CHATBOT_CONFIG,
} from './chatbot.config';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css',
  imports: [CommonModule, FormsModule],
  standalone: true,
})
export class ChatbotComponent implements OnInit, OnChanges, AfterViewChecked {
  @Input() currentRoute: string = '';
  @Input() isOpen: boolean = false;
  @Output() togglePanel = new EventEmitter<void>();

  userName: string = '';
  messages: { text: string; isUser: boolean; isWelcome?: boolean }[] = [];
  newMessage = '';
  config: ChatbotPageConfig = DEFAULT_CHATBOT_CONFIG;
  private hasInitialized = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(private authService: AuthenticationService) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentRoute'] && this.currentRoute) {
      this.config = getChatbotConfig(this.currentRoute);
      // Reset messages when route changes
      this.messages = [];
      this.hasInitialized = false;
    }
    if (changes['isOpen'] && this.isOpen && !this.hasInitialized) {
      this.initializeChat();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      } catch (_) {}
    }
  }

  private initializeChat(): void {
    if (this.hasInitialized) return;
    this.hasInitialized = true;

    const name = this.userName?.split(' ')[0] || 'there';
    this.messages = [
      {
        text: `Hi ${name}! 👋`,
        isUser: false,
        isWelcome: true,
      },
      {
        text: this.config.openingMessage,
        isUser: false,
      },
    ];
  }

  onToggle(): void {
    this.togglePanel.emit();
  }

  onSuggestionClick(suggestion: string): void {
    this.messages.push({ text: suggestion, isUser: true });
    setTimeout(() => {
      this.messages.push({
        text: 'This feature is under development. Intelligent responses will be available soon.',
        isUser: false,
      });
    }, 600);
  }

  sendMessage(): void {
    if (!this.newMessage?.trim()) return;
    const userMsg = this.newMessage.trim();
    this.messages.push({ text: userMsg, isUser: true });
    this.newMessage = '';
    setTimeout(() => {
      this.messages.push({
        text: 'This assistant is under development. Your message has been noted, but intelligent responses are not yet available.',
        isUser: false,
      });
    }, 600);
  }
}
