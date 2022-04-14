import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CuiTableOptions, CuiTableColumnOption } from '@cisco-ngx/cui-components';
import { AppConfigService } from '../providers/app-config.service';
import { ApiHttpService } from '../providers/http.service';


@Component({
  selector: 'app-contract-asset-balance',
  templateUrl: './contract-asset-balance.component.html',
  styleUrls: ['./contract-asset-balance.component.css']
})
export class ContractAssetBalanceComponent implements OnInit {  
  @ViewChild('viewDetails', { static: true })
  viewDetailsTemplate!: TemplateRef<any>;
  
  tableOptions!: CuiTableOptions;
  cabTableData: any[] = [];
  hostUrl!: string;

  offset = 0;
  limit = 10;
  size = 0;

  constructor(private http: ApiHttpService, private config: AppConfigService) { }

  ngOnInit(): void {
    this.getContractAssetBalance();
  }

  onPageUpdated(pageInfo: any) {
    console.log(pageInfo);
    this.offset = pageInfo.page;
    this.getContractAssetBalance();
  }

  getContractAssetBalance(): void {
    this.http.get('contract-asset-balance').subscribe((data: any) => {
      this.cabTableData = data;
      console.log(this.cabTableData);
      
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
      this.tableOptions = new CuiTableOptions({
        bordered: true,
        striped: true,
        columns: cabColumns,
        dynamicData: false
      });
    });
  }

}
