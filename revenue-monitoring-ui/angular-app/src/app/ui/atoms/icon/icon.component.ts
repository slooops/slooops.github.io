import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css'],
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: string = '1rem';
  @Input() ariaLabel?: string;

  get iconClasses(): string {
    // Map icon names to existing CSS classes or generic icon class
    const iconMap: { [key: string]: string } = {
      search: 'magnifying-glass-icon',
      info: 'info-icon',
      check: 'completed-icon',
      add: 'plus-icon',
      edit: 'edit-icon',
      delete: 'delete-icon',
      'chevron-down': 'chevron-down-icon',
    };

    return iconMap[this.name] || 'fit-icon';
  }
}
