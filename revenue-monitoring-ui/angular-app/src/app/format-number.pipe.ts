import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatNumber',
    standalone: true
})
export class FormatNumberPipe implements PipeTransform {
  transform(value: any): any {
    if (value === null || value === 'NA' || value === 0) return value;
    if (!isNaN(value) && value !== null) {
      return Number(value).toLocaleString('en-US');
    }
    return value;
  }
}
