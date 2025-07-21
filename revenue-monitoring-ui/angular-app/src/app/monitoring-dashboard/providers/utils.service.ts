import { Injectable } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class UtilsService {
  initializeForm(
    columnsToFilter: { formControlName: string; type: string }[],
    existingForm?: FormGroup
  ): { form: FormGroup; textFilters: any[]; selectFilters: any[] } {
    const form = existingForm || new FormGroup({});
    const textFilters = columnsToFilter.filter((col) => col.type === 'text');
    const selectFilters = columnsToFilter.filter(
      (col) => col.type === 'select'
    );

    textFilters.forEach((column) => {
      if (!form.contains(column.formControlName)) {
        form.addControl(column.formControlName, new FormControl(''));
      }
    });

    selectFilters.forEach((column) => {
      if (!form.contains(column.formControlName)) {
        form.addControl(column.formControlName, new FormControl([]));
      }
    });

    return { form, textFilters, selectFilters };
  }

  filterDataForSelectFilters(
    filterOptions: { [key: string]: string[] },
    selectFilters: any[],
    details: any[],
    isFiltered: boolean,
    detailsFiltered: any[]
  ): { [key: string]: string[] } {
    // Reset the filter options object
    filterOptions = {};

    // Temporary storage for unique values
    let tempOptions: { [key: string]: string[] } = {};

    // Initialize temporary storage for each select filter
    selectFilters.forEach((column) => {
      tempOptions[column.formControlName] = [];
    });

    // Determine the data source based on filter status
    const dataSource = isFiltered ? detailsFiltered : details;

    // Populate filter options dynamically
    dataSource.forEach((data) => {
      selectFilters.forEach((column) => {
        let value;

        value = data[column.columnName];

        if (value) {
          tempOptions[column.formControlName].push(value);
        }
      });
    });

    Object.keys(tempOptions).forEach((key) => {
      filterOptions[key] = [...new Set(tempOptions[key])];
    });

    return filterOptions;
  }

  filterPredicate(
    data: any,
    filter: string,
    selectFilters: any[],
    textFilters: any[]
  ): boolean {
    const filters = JSON.parse(filter);
    const matchesSelectFilters = selectFilters.every((column) => {
      const filterValue =
        !filters[column.formControlName + 'Filter'] ||
        filters[column.formControlName + 'Filter'].length === 0
          ? true
          : filters[column.formControlName + 'Filter'].includes(
              data[column.columnName]
            );
      return filterValue;
    });
    const matchesTextFilters = textFilters.every((column) => {
      const filterValue = filters[column.formControlName + 'Filter'] || '';
      return (
        data[column.columnName]
          ?.toString()
          .toLowerCase()
          .indexOf(filterValue.toLowerCase()) !== -1
      );
    });
    return matchesSelectFilters && matchesTextFilters;
  }

  applyFilter(
    textFilters: any[],
    selectFilters: any[],
    searchForm: FormGroup,
    dataSource?: any,
    filtereddataSource?: any
  ): void {
    const filters = {};

    textFilters.forEach((column) => {
      filters[column.formControlName + 'Filter'] = searchForm.get(
        column.formControlName
      ).value;
    });

    selectFilters.forEach((column) => {
      filters[column.formControlName + 'Filter'] =
        searchForm.get(column.formControlName).value || '';
    });

    const filterString = JSON.stringify(filters);

    if (dataSource) {
      dataSource.filter = filterString;
    }
    if (filtereddataSource) {
      filtereddataSource.filter = filterString;
    }
  }
}
