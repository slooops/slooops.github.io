import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MenuMiniItem {
  label: string;
  key?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-menu-mini',
  templateUrl: './menu-mini.component.html',
  styleUrls: ['./menu-mini.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class MenuMiniComponent {
  @Input() items: MenuMiniItem[] = [];
  @Input() activeIndex = -1;
  @Input() activeKey = '';
  @Input() @HostBinding('class.dark-theme') darkMode = false;
  @Output() selected = new EventEmitter<{
    index: number;
    item: MenuMiniItem;
  }>();

  open = false;

  constructor(private elRef: ElementRef) {}

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.open = !this.open;
  }

  select(index: number, item: MenuMiniItem): void {
    if (item.disabled) return;
    this.selected.emit({ index, item });
    this.open = false;
  }

  isActive(index: number, item: MenuMiniItem): boolean {
    if (this.activeKey) return this.activeKey === item.key;
    return this.activeIndex === index;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}
