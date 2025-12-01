import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'truncate',
    standalone: true
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, args?: any): any {
    if (!value) {
      return '';
    }

    const words = value.split(' ');

    // truncate to first two words
    return words.slice(0, 2).join(' ');

    // return value.replace('OPERATING UNIT', '').trim();
  }
}
