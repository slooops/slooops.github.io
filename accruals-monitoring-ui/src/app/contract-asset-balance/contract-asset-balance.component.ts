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
  @ViewChild('viewDetailsRow')
  viewDetailsRowTemplate!: TemplateRef<any>;
  @ViewChild('dateCell')
  dateCellTemplate!: TemplateRef<any>;
  @ViewChild('commentsCell')
  commentsCellTemplate!: TemplateRef<any>;

  cabColumnOptions: CuiTableColumnOption[] = [];
  cabTableOptions!: CuiTableOptions;
  
  cabDetailsColumnOptions: CuiTableColumnOption[] = [];
  cabDetailsOptions!: CuiTableOptions;

  cabTableData: any[] = [];
  cabDetailsData: any[] = [];

  cabColumnMappings: Map<string, string> = new Map(Object.entries({
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

  detailColumnMappings: Map<string, string> = new Map(Object.entries({
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

  selectedRow: any = undefined;
  comments: string = '';

  owners: string[] = ['OPL', 'SBP', 'ARADM'];
  selectedOwner: string = '';
  currentOwner?: string;

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
    this.selectedRow = data;
    this.selectedOwner = data.OWNER;
    this.currentOwner = data.OWNER;
    this.modal.show(this.viewDetailsRowTemplate, 'full');

    var detailsParams = {
      "orgId" : data.ORG_ID,
      "subRefId": data.SUBSCRIPTION_REF_ID,
      "itemName": data.ITEM_NAME
    };

    console.log(data);

    this.http.get('contract-asset-balance/details', { params: detailsParams })
      .subscribe((data: any) => {
        this.cabDetailsData = data;
        this.size = data.length;

        for (let column of Object.keys(this.cabDetailsData[0])) {
          if (this.detailColumnMappings.has(column)) {
            this.cabDetailsColumnOptions.push(new CuiTableColumnOption({
              'name': this.detailColumnMappings.get(column),
              'sortable': true,
              'key': column
            }));
          }
        }
      });
      this.cabDetailsOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        columns: this.cabDetailsColumnOptions,
        dynamicData: false,
        wrapText: true
      });
  }

  getContractAssetBalance(): void {
    this.http.get('contract-asset-balance').subscribe((data: any) => {
      this.cabTableData = data;
      
      this.cabColumnOptions.push(new CuiTableColumnOption({
        name: '',
        template: this.viewDetailsTemplate
      }));

      for (let column of Object.keys(this.cabTableData[0])) {
        if(column == 'BDOM_DATE') {
          this.cabColumnOptions.push(new CuiTableColumnOption({
            'name': this.cabColumnMappings.get(column),
            'sortable': true,
            'key': column,
            'template': this.dateCellTemplate
          }));
        } else if (column == 'COMMENTS') {
          this.cabColumnOptions.push(new CuiTableColumnOption({
            'name': this.cabColumnMappings.get(column),
            'sortable': true,
            'key': column,
            'template': this.commentsCellTemplate
          }));
        } else if (this.cabColumnMappings.has(column)) {
          this.cabColumnOptions.push(new CuiTableColumnOption({
            'name': this.cabColumnMappings.get(column),
            'sortable': true,
            'key': column
          }));
        }
      }

      this.cabTableOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        columns: this.cabColumnOptions,
        singleSelect: true,
        dynamicData: false,
        wrapText: true
      });

      this.size = this.cabTableData.length;
    });
  }

  appendComment(comments: string, modifiedRow?:any): string {
    let existingComments = '';
    if (modifiedRow) {
      existingComments = (modifiedRow.COMMENTS ?  modifiedRow.COMMENTS + '\n' : '');
    } else {
      existingComments = (this.selectedRow.COMMENTS ?  this.selectedRow.COMMENTS + '\n' : '');
    }
    let appendedComments = existingComments 
                            + this.currentOwner 
                            + '(' + new Date().toLocaleString() + '): '
                            + comments;
    return appendedComments;
  }

  isOwnerChanged(owner: string): boolean {
    return this.currentOwner != owner;
  }

  save() {
    let rowId = this.selectedRow.ROWID;
    let modifiedRow = this.selectedRow;
    if (this.comments) {
      modifiedRow.COMMENTS = this.appendComment(this.comments, modifiedRow);
    }
    if (this.isOwnerChanged(this.selectedOwner)) {
      modifiedRow.OWNER = this.selectedOwner;
      modifiedRow.COMMENTS = this.appendComment('Assigned to ' + this.selectedOwner);
      console.log(modifiedRow.COMMENTS);
    }
    this.http.put('contract-asset-balance/' + rowId, modifiedRow).subscribe((data: any) => {
      this.selectedRow = data;
    });
    this.closeModal();
    this.comments = '';
    this.selectedRow = undefined;
  }

  closeModal() {
    this.selectedRow = undefined;
    this.modal.hide();
  }

  whatisthis(item: any) {
    console.log(item);
  }

}
