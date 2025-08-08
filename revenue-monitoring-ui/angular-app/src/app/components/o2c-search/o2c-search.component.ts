import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ApiHttpService } from 'src/app/providers/http.service';
import {
  SearchContextService,
  O2cSearchResult,
} from 'src/app/search-context.service';

@Component({
  selector: 'app-o2c-search',
  templateUrl: './o2c-search.component.html',
  styleUrls: ['./o2c-search.component.css'],
})
export class O2cSearchComponent {
  searchValue: string = '';
  searchType: string = 'order'; // Default value

  o2cConnectorData: any[] = [];

  constructor(
    private router: Router,
    private http: ApiHttpService,
    private destroyManager: DestroyManager,
    private searchContextService: SearchContextService
  ) {}

  onSearchTypeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.searchType = target.value;
  }

  onSearchValueChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchValue = target.value;
  }

  onSearch(): void {
    const trimmedValue = this.searchValue.trim();
    if (!trimmedValue) return;

    const columnMap: { [key: string]: string } = {
      order: 'WEBORDER_ID',
      subscription: 'SUBSCRIPTION_REF_ID',
      invoice: 'TRX_NUMBER',
    };

    const columnName = columnMap[this.searchType] || 'UNKNOWN_COLUMN';

    this.http
      .post('o2c-connector-search', {
        column: columnName,
        value: trimmedValue,
      })
      .subscribe({
        next: (data: any) => {
          console.log('Search results:', data);
          const orderIds: string[] = [
            ...new Set(
              data.map((r: any) => r.WEBORDER_ID).filter(Boolean) as string[]
            ),
          ];
          const subRefIds: string[] = [
            ...new Set(
              data
                .map((r: any) => r.SUBSCRIPTION_REF_ID)
                .filter(Boolean) as string[]
            ),
          ];
          const subCodes: string[] = [
            ...new Set(
              data
                .map((r: any) => r.SUBSCRIPTION_CODE)
                .filter(Boolean) as string[]
            ),
          ];
          const trxNumbers: string[] = [
            ...new Set(
              data.map((r: any) => r.TRX_NUMBER).filter(Boolean) as string[]
            ),
          ];

          this.searchContextService.emitSearchPayload({
            searchType: this.searchType,
            searchValue: trimmedValue,
            orderId: orderIds[0] || 'No Results ',
            subRefIds: subRefIds,
            invoiceIds: trxNumbers,
            subCodes: subCodes,
          });

          const isTabbedView = this.router.url.includes('business-insights');

          if (!isTabbedView) {
            this.router.navigate(['/o2c-360'], {
              queryParams: {
                searchType: this.searchType,
                searchValue: trimmedValue,
                orderId: orderIds[0],
                subRefIds: subRefIds.join(','),
                invoiceIds: trxNumbers.join(','),
                subCodes: subCodes.join(','),
              },
            });
          }
        },
        error: (err) => console.error('Search error:', err),
      });
  }
}
