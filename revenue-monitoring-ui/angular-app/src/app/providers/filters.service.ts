import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  applyFilters(originalData: any[], filters: { [key: string]: string }): any[] {
    let filtered = [...originalData];
    for (const col in filters) {
      const filterVal = filters[col];
      if (!filterVal || filterVal === 'all') continue;
      filtered = filtered.filter((row) => {
        const val = row[col];
        if (col.toUpperCase().includes('AMOUNT')) {
          const numericVal =
            typeof val === 'string'
              ? parseFloat(val.replace(/[$,]/g, ''))
              : val;
          const match = filterVal.match(
            /(equal|greater|less)[^\d]*(-?\d+(\.\d+)?)/i
          );
          if (match) {
            const keyword = match[1].toLowerCase();
            const number = parseFloat(match[2]);
            if (keyword === 'equal') return numericVal === number;
            if (keyword === 'greater') return numericVal > number;
            if (keyword === 'less') return numericVal < number;
          }
          return true;
        }
        if (typeof filterVal === 'string') {
          return val
            ?.toString()
            .toLowerCase()
            .includes(filterVal.toLowerCase());
        }
        return val === filterVal;
      });
    }
    return filtered;
  }
}
