import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private hiddenSubject = new BehaviorSubject<boolean>(false);
  hidden$ = this.hiddenSubject.asObservable();

  hide(): void {
    this.hiddenSubject.next(true);
  }

  show(): void {
    this.hiddenSubject.next(false);
  }
}
