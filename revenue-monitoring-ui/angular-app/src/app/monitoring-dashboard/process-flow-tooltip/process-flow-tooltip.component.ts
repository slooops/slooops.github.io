import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { DataService } from 'src/app/providers/data.service';

@Component({
  selector: 'app-process-flow-tooltip',
  templateUrl: './process-flow-tooltip.component.html',
  styleUrl: './process-flow-tooltip.component.css',
})
export class ProcessFlowTooltipComponent implements OnInit {
  @Input() processFlowTabsToDisplay: string[];

  totals$: Observable<{ [tabName: string]: { [key: string]: number } }>;

  tabsToDisplay: string[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.totals$ = this.getCombinedTotals(['Pre-Invoicing', 'Auto-Invoicing']);
    console.log('totals$:', this.totals$);
  }

  private getCombinedTotals(
    tabNames: string[]
  ): Observable<{ [tabName: string]: { [key: string]: number } }> {
    const tabObservables = tabNames.map((tabName) =>
      this.dataService
        .getTabData(tabName)
        .pipe(map((totals) => ({ [tabName]: totals })))
    );

    return combineLatest(tabObservables).pipe(
      map((results) => Object.assign({}, ...results))
    );
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
