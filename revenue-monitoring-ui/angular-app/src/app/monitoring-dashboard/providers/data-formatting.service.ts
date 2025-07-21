import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class DataFormattingService {
  constructor(private datePipe: DatePipe) {}
  specialWords: string[] = [
    'name',
    'amount',
    'interface',
    'error',
    'number',
    'total',
    'hold',
    'pending',
    'status',
    'num',
    'year',
    'status',
    'sub',
    'staging',
    'id',
    'line',
  ];

  skippedWords: string[] = ['IOL', 'AR', 'ID'];

  replaceUnderscore(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => {
        if (!this.skippedWords.includes(word)) {
          const lowerWord = word.toLowerCase();
          if (this.specialWords.includes(lowerWord)) {
            return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        } else {
          return word;
        }
      })
      .join(' ');
  }

  dateTransform(dateString: string): string {
    return this.datePipe.transform(dateString, 'MM/dd/yyyy');
  }

  formatData(data: any[]): any[] {
    return data.map((row) => {
      const formattedRow = { ...row };
      const amountKeys = [
        'AMOUNT',
        'BILL_TOTAL',
        'IOL_HOLD',
        'IOL_PENDING',
        'IOL_ERROR',
        'AR_INTERFACE',
        'AR_INTERFACE_ERROR',
        'INVOICED',
        'BALANCE',
        'ACCOUNTED_CR',
        'ACCOUNTED_DR',
        'ENTERED_CR',
        'ENTERED_DR',
        'USD_AMOUNT',
      ];
      let key;
      amountKeys.forEach((amountKey) => {
        key = amountKey in row ? amountKey : amountKey.toLowerCase();
        if (key in row) {
          if (formattedRow[key] == '-') {
            return;
          }
          formattedRow[key] = `$${Number(row[key]).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        }
      });

      return formattedRow;
    });
  }

  camelCase(str) {
    const camelKey = str
      .toLowerCase()
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    return `${camelKey}s`;
  }
  getNextSortDirection(
    currentColumn: string | null,
    clickedColumn: string,
    currentDirection: 'asc' | 'desc' | ''
  ): 'asc' | 'desc' | '' {
    if (currentColumn === clickedColumn) {
      return currentDirection === 'desc'
        ? 'asc'
        : currentDirection === 'asc'
        ? ''
        : 'desc';
    } else {
      return 'desc';
    }
  }

  sortData(data: any[], column: string, direction: 'asc' | 'desc' | ''): any[] {
    if (direction === '') return [...data];
    return [...data].sort((a, b) =>
      this.compare(a[column], b[column], column, direction)
    );
  }

  compare(
    a: any,
    b: any,
    column: string,
    direction: 'asc' | 'desc' | ''
  ): number {
    let valueA = a;
    let valueB = b;

    if (column === 'AMOUNT') {
      valueA = parseFloat(a.replace(/[$,]/g, '')) || 0;
      valueB = parseFloat(b.replace(/[$,]/g, '')) || 0;
    } else if (column === 'AGING') {
      valueA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      valueB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    } else if (column === 'PROCESS_FLOW') {
      const processFlowNumberA = parseInt(a.split(' - ')[0], 10) || 0;
      const processFlowNumberB = parseInt(b.split(' - ')[0], 10) || 0;
      valueA = processFlowNumberA;
      valueB = processFlowNumberB;
    } else if (column === 'ORG_NAME' || column === 'ERROR_MESSAGE') {
      valueA = a.toUpperCase();
      valueB = b.toUpperCase();
    }

    const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    return direction === 'asc' ? comparison : -comparison;
  }
}
