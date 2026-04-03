import { Pipe, PipeTransform } from '@angular/core';

/**
 * Lightweight inline-markdown pipe.
 * Supports:  **bold**,  *italic*,  and auto-linked URLs
 *
 * Usage:  <span [innerHTML]="text | markdown"></span>
 */
@Pipe({ name: 'markdown', standalone: true })
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';

    // 1. Escape HTML to prevent XSS
    let s = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // 2. Auto-linkify URLs (https://, http://, or www.)
    s = s.replace(
      /\b(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>',
    );

    // 3. Bold: **text**
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 4. Italic: *text*
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

    return s;
  }
}
