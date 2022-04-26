import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { 
  CuiTableOptions, 
  CuiTableColumnOption, 
  CuiFilterOptions,
  CuiModalService } from '@cisco-ngx/cui-components';
import { ApiHttpService } from '../providers/http.service';


@Component({
  selector: 'app-contract-asset-balance',
  templateUrl: './contract-asset-balance.component.html',
  styleUrls: ['./contract-asset-balance.component.css']
})
export class ContractAssetBalanceComponent implements OnInit {  
  @ViewChild('viewDetails', { static: true })
  viewDetailsTemplate!: TemplateRef<any>;
  @ViewChild('viewComments', { static: true })
  viewCommentsTemplate!: TemplateRef<any>;
  @ViewChild('viewDetailsRow')
  viewDetailsRowTemplate!: TemplateRef<any>;
  @ViewChild('dateCell')
  dateCellTemplate!: TemplateRef<any>;

  cabTableOptions!: CuiTableOptions;
  cabDetailsOptions!: CuiTableOptions;
  cabTableData: any[] = [];
  cabDetailsData: any[] = [];

  cabColumns: Map<string, string> = new Map(Object.entries({
    OU_NAME: 'Operating Unit',
    SUBSCRIPTION_REF_ID: 'Subscription ID',
    ITEM_NAME: 'SKU',
    OA_FLAG: 'OA Flag',
    CURRENCY_CODE: 'Currency',
    CONTRA_DR_AMOUNT: 'Contract Assets DR Amount',
    CONTRA_CR_AMOUNT: 'Contract Assets CR Amount',
    BALANCE_AMOUNT_TRANSACTIONAL: 'Balance Amount Transactional',
    BALANCE_AMOUNT_USD: 'Balance Amount USD',
    BDOM_DATE: 'Calculated BDOM',
    CURRENT_STATUS: 'Status',
    OWNER: 'Owner',
    COMMENTS: 'Comments'    
  }));

  detailColumns: Map<string, string> = new Map(Object.entries({
    OU_NAME: 'Operating Unit',
    SUBSCRIPTION_REF_ID: 'Subscription ID',
    ITEM_NAME: 'SKU',
    ORIGINAL_UNIQUE_ID: 'Original Unique ID',
    CURRENCY: 'Currency',
    SBP_INV_AMOUNT: 'TSV-INV Total',
    SBP_CM_AMOUNT: 'TSV-CM Total',
    AR_INV_AMOUNT: 'AR-INV Total',
    AR_CM_AMOUNT: 'AR-CM Total',
    CONTRA_DEBIT: 'Contract Assets DR',
    CONTRA_CREDIT: 'Contract Assets CR',
    ' TOP SKU BALANCE': 'Top Sku Balance',
    'SUB SKU BALANCE': 'Sub Sku Balance',
    AMOUNT_NET_USD: 'Balance Amount USD'
  }));

  comments: string = '';

  offset = 0;
  limit = 10;
  size = 0;

  filters: any;
  filterOptions = new CuiFilterOptions({
    filters: [
      {
        label: 'Subscription Ref ID',
        value: 'subRefId'
      },
      {
        label: 'Item Name',
        value: 'itemName'
      },
      {
        label: 'Transaction Status',
        value: 'trxStatus'
      }
    ]
  });

  constructor(private http: ApiHttpService, private modal: CuiModalService) { }

  ngOnInit(): void {
    this.getContractAssetBalance();
  }

  onPageUpdated(pageInfo: any) {
    console.log(pageInfo);
    this.offset = pageInfo.page;
  }

  onFiltersChanged(filters: any) {
    this.filters = filters;
  }

  viewTrxDetails(data: any) {
    this.cabDetailsData = [];
    this.modal.show(this.viewDetailsRowTemplate, 'full');

    var detailsParams = {
      "orgId" : data.ORG_ID,
      "subRefId": data.SUBSCRIPTION_REF_ID,
      "itemName": data.ITEM_NAME
    };

    this.http.get('contract-asset-balance/details', { params: detailsParams })
      .subscribe((data: any) => {
        this.cabDetailsData = data;
        this.size = data.length;

        let detailsColumns: CuiTableColumnOption[] = [];

        for (let column of Object.keys(this.cabDetailsData[0])) {
          if (this.detailColumns.has(column)) {
            detailsColumns.push(new CuiTableColumnOption({
              'name': this.detailColumns.get(column),
              'sortable': true,
              'key': column
            }));
          }
        }

        this.cabDetailsOptions = new CuiTableOptions({
          bordered: true,
          striped: true,
          columns: detailsColumns,
          dynamicData: false,
          wrapText: true
        });
      });
  }

  getContractAssetBalance(): void {
    this.http.get('contract-asset-balance').subscribe((data: any) => {
      this.cabTableData = data;
      
      let cabColumns: CuiTableColumnOption[] = [];
      cabColumns.push(new CuiTableColumnOption({
        name: '',
        template: this.viewDetailsTemplate
      }));

      for (let column of Object.keys(this.cabTableData[0])) {
        if(column == 'BDOM_DATE') {
          cabColumns.push(new CuiTableColumnOption({
            'name': this.cabColumns.get(column),
            'sortable': true,
            'key': column,
            'template': this.dateCellTemplate
          }));
        } else if (this.cabColumns.has(column)) {
          cabColumns.push(new CuiTableColumnOption({
            'name': this.cabColumns.get(column),
            'sortable': true,
            'key': column
          }));
        }
      }

      this.size = this.cabTableData.length;
      this.cabTableOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        columns: cabColumns,
        singleSelect: true,
        dynamicData: false,
        wrapText: true
      });      
    });
  }

  addComment() {
    this.closeModal();
  }

  closeModal() {
    this.cabDetailsData = [];
    this.modal.hide();
  }

  whatisthis(item: any) {
    console.log(item);
  }

}
