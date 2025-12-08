import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.css'],
})
export class TextInputComponent implements OnDestroy {
  @Input() value: string = '';
  @Input() placeholder: string = '';
  @Input() label?: string;
  @Input() type: 'text' | 'email' | 'search' = 'text';
  @Input() iconPosition?: 'left' | 'right';
  @Input() iconName?: string;
  @Input() debounceMs: number = 300;
  @Input() isDisabled: boolean = false;
  @Input() noBorder: boolean = false;

  @Output() valueChange = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<string>();

  private inputSubject = new Subject<string>();
  private subscription: any;

  ngOnInit(): void {
    this.subscription = this.inputSubject
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged())
      .subscribe((value) => {
        this.valueChange.emit(value);
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  get inputClasses(): string {
    const classes = ['fit-input'];

    if (this.iconName && this.iconPosition === 'left') {
      classes.push('fit-input--icon-left');
    }

    if (this.iconName && this.iconPosition === 'right') {
      classes.push('fit-input--icon-right');
    }

    if (this.noBorder) {
      classes.push('fit-input--no-border');
    }

    return classes.join(' ');
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.inputSubject.next(this.value);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.submitted.emit(this.value);
    }
  }
}
