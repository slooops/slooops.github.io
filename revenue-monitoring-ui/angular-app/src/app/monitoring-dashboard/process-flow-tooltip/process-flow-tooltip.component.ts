import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ElementRef,
  Renderer2,
  TemplateRef,
} from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { DataService } from 'src/app/providers/data.service';

@Component({
  selector: 'app-process-flow-tooltip',
  templateUrl: './process-flow-tooltip.component.html',
  styleUrl: './process-flow-tooltip.component.css',
})
export class ProcessFlowTooltipComponent implements OnInit, OnChanges {
  @Input() processFlowTabsToDisplay: string[];
  @Input() dynamicTemplate: TemplateRef<any> | null = null;
  @Input() dynamicCss: string = '';
  totals$:
    | Observable<{ [tabName: string]: { [key: string]: number } }>
    | undefined;
  tabsToDisplay: string[] = [];
  processFlowhtml: string = '';
  processFlowcss: string = '';
  htmlContent: string = '';
  htmlTemplate: TemplateRef<any> | null = null;
  csstemplate: string = '';

  constructor(
    private dataService: DataService,
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['processFlowTabsToDisplay'] &&
      changes['dynamicTemplate'] &&
      changes['dynamicCss']
    ) {
      this.tabsToDisplay = this.processFlowTabsToDisplay;
      this.totals$ = this.getCombinedTotals(this.tabsToDisplay);
      this.htmlTemplate = this.dynamicTemplate;
      this.injectCss();
    }
  }

  ngAfterViewInit() {}

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

  injectCss() {
    if (this.dynamicCss) {
      const style = this.renderer.createElement('style');
      style.innerHTML = this.dynamicCss;
      this.renderer.appendChild(this.el.nativeElement, style);
    }
  }
}
