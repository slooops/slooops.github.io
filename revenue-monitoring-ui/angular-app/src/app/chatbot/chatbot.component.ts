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
  OnDestroy,
  HostListener,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { AuthenticationService } from '../providers/authentication.service';
import { ChatbotService } from './chatbot.service';
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
export class ChatbotComponent
  implements OnInit, OnChanges, AfterViewChecked, OnDestroy
{
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
  isStreaming: boolean = false;
  isStatusPhase: boolean = false;
  statusMessage: string = '';
  private abortController: AbortController | null = null;

  /* ── Resize state ── */
  panelWidth = 380;
  panelHeight = 560;
  private readonly MIN_WIDTH = 320;
  private readonly MAX_WIDTH = 700;
  private readonly MIN_HEIGHT = 400;
  private readonly MAX_HEIGHT = Math.max(window.innerHeight - 60, 500);

  private isResizing = false;
  private resizeEdge: 'left' | 'top' | 'top-left' = 'left';
  private startX = 0;
  private startY = 0;
  private startW = 0;
  private startH = 0;

  private boundMouseMove = this.onResizeMove.bind(this);
  private boundMouseUp = this.onResizeEnd.bind(this);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(
    private authService: AuthenticationService,
    private httpClient: HttpClient,
    private ngZone: NgZone,
    private chatbotService: ChatbotService,
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.getUserName();
    this.userEmail = this.authService.getUserID();
    console.log('[Chatbot] Initialized with userName:', this.userName);
    if (!this.apiUrl) {
      this.apiUrl =
        this.authService.getControlTowerSupportAgentApiUrl() ||
        'http://localhost:8000';
    }
    console.log('[Chatbot] apiUrl:', this.apiUrl);
    console.log(
      '[Chatbot] userName:',
      this.userName,
      'userEmail:',
      this.userEmail,
    );
  }

  ngOnDestroy(): void {
    this.cancelRequest();
    this.cleanupResizeListeners();
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

    const body = {
      userName: this.userName,
      userEmail: this.userEmail.toLowerCase() + '@cisco.com',
      message,
    };

    // Create empty assistant message bubble for streaming
    const assistantMsg = { text: '', isUser: false };
    this.messages.push(assistantMsg);

    this.abortController = new AbortController();
    const streamUrl = `${this.apiUrl}/control-tower-ui-chat-stream`;

    console.log('[Chatbot] SSE POST', streamUrl, body);

    fetch(streamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    })
      .then((res) => {
        if (!res.ok || !res.body) {
          throw new Error(`Stream connection failed: ${res.status}`);
        }
        return this.processSSEStream(res.body, assistantMsg);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          assistantMsg.text = assistantMsg.text || 'Request cancelled.';
          this.isLoading = false;
          this.isStreaming = false;
          this.abortController = null;
          return;
        }
        // Fallback to non-streaming endpoint
        console.warn(
          '[Chatbot] Stream failed, falling back to regular POST',
          err,
        );
        this.callAgentFallback(body, assistantMsg);
      });
  }

  private async processSSEStream(
    body: ReadableStream<Uint8Array>,
    assistantMsg: { text: string; isUser: boolean },
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.trim()) continue;
          let eventName = '';
          let data = '';

          for (const line of part.split('\n')) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              data = line.slice(6);
            }
          }

          if (!eventName || !data) continue;

          if (eventName === 'status') {
            const payload = JSON.parse(data) as { message: string };
            this.ngZone.run(() => {
              this.isStatusPhase = true;
              this.statusMessage = payload.message || 'Processing…';
            });
          } else if (eventName === 'token') {
            const chunk = JSON.parse(data) as string;
            this.ngZone.run(() => {
              this.isStatusPhase = false;
              this.statusMessage = '';
              assistantMsg.text += chunk;
              this.isStreaming = true;
            });
          } else if (eventName === 'done') {
            const payload = JSON.parse(data) as { full_response: string };
            this.ngZone.run(() => {
              assistantMsg.text = payload.full_response;
              this.isLoading = false;
              this.isStreaming = false;
              this.isStatusPhase = false;
              this.statusMessage = '';
              this.abortController = null;
            });
            return;
          } else if (eventName === 'error') {
            const payload = JSON.parse(data) as { error: string };
            this.ngZone.run(() => {
              assistantMsg.text = payload.error || 'An error occurred.';
              this.isLoading = false;
              this.isStreaming = false;
              this.isStatusPhase = false;
              this.statusMessage = '';
              this.abortController = null;
            });
            return;
          }
        }
      }

      // Stream ended without a done event
      this.ngZone.run(() => {
        if (!assistantMsg.text) {
          assistantMsg.text = 'No response received.';
        }
        this.isLoading = false;
        this.isStreaming = false;
        this.abortController = null;
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        this.ngZone.run(() => {
          assistantMsg.text = 'Stream interrupted. Please try again.';
          this.isLoading = false;
          this.abortController = null;
        });
      }
    }
  }

  private callAgentFallback(
    body: { userName: string; userEmail: string; message: string },
    assistantMsg: { text: string; isUser: boolean },
  ): void {
    const url = `${this.apiUrl}/control-tower-ui-chat`;
    this.httpClient.post<{ response: string }>(url, body).subscribe({
      next: (res) => {
        assistantMsg.text = res.response || 'No response received.';
        this.isLoading = false;
        this.abortController = null;
      },
      error: (err) => {
        console.error('Agent API error:', err);
        assistantMsg.text =
          'Something went wrong reaching the assistant. Please try again.';
        this.isLoading = false;
        this.abortController = null;
      },
    });
  }

  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.isLoading = false;
      this.isStreaming = false;
      this.isStatusPhase = false;
      this.statusMessage = '';
    }
  }

  /* ── Resize logic ── */
  onResizeStart(event: MouseEvent, edge: 'left' | 'top' | 'top-left'): void {
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;
    this.resizeEdge = edge;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startW = this.panelWidth;
    this.startH = this.panelHeight;

    // Attach listeners outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.boundMouseMove);
      document.addEventListener('mouseup', this.boundMouseUp);
    });

    document.body.style.cursor = this.getCursorForEdge(edge);
    document.body.style.userSelect = 'none';
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const dx = this.startX - event.clientX; // inverted: dragging left increases width
    const dy = this.startY - event.clientY; // inverted: dragging up increases height

    let newW = this.startW;
    let newH = this.startH;

    if (this.resizeEdge === 'left' || this.resizeEdge === 'top-left') {
      newW = Math.min(
        this.MAX_WIDTH,
        Math.max(this.MIN_WIDTH, this.startW + dx),
      );
    }
    if (this.resizeEdge === 'top' || this.resizeEdge === 'top-left') {
      newH = Math.min(
        this.MAX_HEIGHT,
        Math.max(this.MIN_HEIGHT, this.startH + dy),
      );
    }

    this.ngZone.run(() => {
      this.panelWidth = newW;
      this.panelHeight = newH;
    });
  }

  private onResizeEnd(): void {
    this.isResizing = false;
    this.cleanupResizeListeners();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private cleanupResizeListeners(): void {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }

  private getCursorForEdge(edge: string): string {
    switch (edge) {
      case 'left':
        return 'ew-resize';
      case 'top':
        return 'ns-resize';
      case 'top-left':
        return 'nwse-resize';
      default:
        return 'default';
    }
  }
}
