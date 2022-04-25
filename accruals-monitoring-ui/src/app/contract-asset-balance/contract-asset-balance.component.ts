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

  
  cabTableOptions!: CuiTableOptions;
  cabDetailsOptions!: CuiTableOptions;
  cabTableData: any[] = [];
  cabDetailsData: any[] = [];
  hostUrl!: string;

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
    this.getContractAssetBalance();
  }

  onFiltersChanged(filters: any) {
    this.filters = filters;
  }

  viewTrxDetails(data: any) {
    this.cabDetailsData = [];
    this.modal.show(this.viewDetailsRowTemplate, 'full');

    console.log('view trx details');
    console.log(data);

    var detailsParams = {
      "orgId" : data.ORG_ID,
      "subRefId": data.SUBSCRIPTION_REF_ID,
      "itemName": data.ITEM_NAME
    };

    this.http.get('contract-asset-balance/details', { params: detailsParams })
      .subscribe((data: any) => {
        this.cabDetailsData = data;
        console.log(this.cabDetailsData);

        let detailsColumns: CuiTableColumnOption[] = [];

        for (let column of Object.keys(this.cabDetailsData[0])) {
          detailsColumns.push(new CuiTableColumnOption({
            'name': column,
            'sortable': true,
            'key': column
          }));
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
        cabColumns.push(new CuiTableColumnOption({
          'name': column,
          'sortable': true,
          'key': column
        }));
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

}
