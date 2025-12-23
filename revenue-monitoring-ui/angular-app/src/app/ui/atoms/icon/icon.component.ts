import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.css'],
  standalone: true,
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: string = '1rem';
  @Input() ariaLabel?: string;

  get iconClasses(): string {
    // Map icon names to existing CSS classes that match actual SVG files in assets/icons
    const iconMap: { [key: string]: string } = {
      search: 'search-icon',
      info: 'info-icon',
      completed: 'completed-icon',
      delete: 'delete-icon',
      close: 'close-icon',
      'close-white': 'close-icon-white',
      download: 'download-icon',
      'download-white': 'download-icon-white',
      home: 'home-icon',
      chart: 'chart-icon',
      chatbot: 'chatbot-icon',
      delayed: 'delayed-icon',
      'in-progress': 'in-progress-icon',
      stopped: 'stopped-icon',
      'yet-to-start': 'yet-to-start-icon',
      refresh: 'ph-refresh-icon',
      'escalation-one': 'escalation-one-icon',
      'escalation-two': 'escalation-two-icon',
      ivan: 'ivan-icon',
    };

    return iconMap[this.name] || 'fit-icon';
  }
}
