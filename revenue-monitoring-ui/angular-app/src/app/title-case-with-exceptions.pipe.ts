import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'titleCaseWithExceptions',
    standalone: false
})
export class TitleCaseWithExceptionsPipe implements PipeTransform {
  transform(value: string, ...exceptions: string[]): string {
    if (!value) return value;

    // Special handling for specific mixed-case patterns
    const mixedCaseMap: { [key: string]: string } = {
      QOQ: 'QoQ',
      YOY: 'YoY',
      MOM: 'MoM',
      PQM: 'PQM',
    };

    // Check if the entire value matches a quarter pattern (e.g., Q1FY26)
    if (/^Q\d+FY\d+$/i.test(value)) {
      return value.toUpperCase();
    }

    // Check if the entire value has a mixed-case mapping
    if (mixedCaseMap[value.toUpperCase()]) {
      return mixedCaseMap[value.toUpperCase()];
    }

    // Check if the value is in the exceptions list (case-insensitive)
    if (exceptions.some((ex) => ex.toUpperCase() === value.toUpperCase())) {
      return value.toUpperCase();
    }

    // Replace underscores with spaces
    value = value.replace(/_/g, ' ');

    return value
      .split(' ')
      .map((word) => {
        // Check if word matches quarter pattern
        if (/^Q\d+FY\d+$/i.test(word)) {
          return word.toUpperCase();
        }

        // Check if word has a mixed-case mapping
        if (mixedCaseMap[word.toUpperCase()]) {
          return mixedCaseMap[word.toUpperCase()];
        }

        // Check if word is in exceptions (case-insensitive)
        if (exceptions.some((ex) => ex.toUpperCase() === word.toUpperCase())) {
          return word.toUpperCase();
        }

        // Check if it's a 2-letter acronym
        if (word.length <= 2) {
          return word.toUpperCase();
        }

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
