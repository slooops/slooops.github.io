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
import { HttpClient } from '@angular/common/http';
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
  @Input() apiUrl: string = '';
  @Output() togglePanel = new EventEmitter<void>();

  userName: string = '';
  userEmail: string = '';
  messages: { text: string; isUser: boolean; isWelcome?: boolean }[] = [];
  newMessage = '';
  config: ChatbotPageConfig = DEFAULT_CHATBOT_CONFIG;
  private hasInitialized = false;

  isLoading: boolean = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private authService: AuthenticationService,
    private httpClient: HttpClient,
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.userEmail = this.authService.getUserID();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentRoute'] && this.currentRoute) {
      this.config = getChatbotConfig(this.currentRoute);
      // Reset messages when route changes
      this.messages = [];
      this.hasInitialized = false;
      // Re-initialize immediately if the panel is already open
      if (this.isOpen) {
        this.initializeChat();
      }
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
    this.callAgent(suggestion);
  }

  sendMessage(): void {
    if (!this.newMessage?.trim() || this.isLoading) return;
    const userMsg = this.newMessage.trim();
    this.messages.push({ text: userMsg, isUser: true });
    this.newMessage = '';
    this.callAgent(userMsg);
  }

  private callAgent(message: string): void {
    this.isLoading = true;

    this.httpClient
      .post<{ response: string }>(`${this.apiUrl}/control-tower-ui-chat`, {
        userName: this.userEmail,
        userEmail: this.userEmail.toLowerCase() + '@cisco.com',
        message,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.messages.push({
            text: res.response || 'No response received.',
            isUser: false,
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Agent API error:', err);
          this.messages.push({
            text: 'Something went wrong reaching the assistant. Please try again.',
            isUser: false,
          });
        },
      });
  }
}
