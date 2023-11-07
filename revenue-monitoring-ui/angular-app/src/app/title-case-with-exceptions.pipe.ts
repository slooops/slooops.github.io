import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'titleCaseWithExceptions',
})
export class TitleCaseWithExceptionsPipe implements PipeTransform {
  transform(value: string, ...exceptions: string[]): string {
    if (!value) return value;

    value = value.replace(/_/g, ' ');

    return value
      .split(' ')
      .map((word) => {
        if (word.length <= 2 && exceptions.includes(word.toUpperCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
