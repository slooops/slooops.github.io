import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DestroyManager } from '../providers/destroy-manager.service';
import { ApiHttpService } from '../providers/http.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ChartData, ChartDataset } from 'chart.js/auto';
import { ChartOptions } from 'chart.js'; // Import ChartOptions for proper typing

@Component({
  selector: 'app-o2c-landing',
  templateUrl: './o2c-landing.component.html',
  styleUrls: ['./o2c-landing.component.css'],
})
export class O2cLandingComponent implements OnInit {
  searchValue: string = '';
  searchType: string = 'order'; // default

  o2cConnectorData: any[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: ApiHttpService,
    private destroyManager: DestroyManager
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const searchValue = params.get('searchValue');
      const searchType = params.get('searchType');

      if (searchValue) {
        this.searchValue = searchValue;
        this.onSearch();
      }

      //might need to review this later
      // if (searchType) {
      //   this.searchType = searchType;
      // }

      // if (searchValue && searchType) {
      //   this.onSearch();
      // }
    });

    // Dummy data
    const dummyData = [
      { BATCH_SOURCE: 'Order Entry', TOTAL_COUNT: 130 },
      { BATCH_SOURCE: 'Manual Entry', TOTAL_COUNT: 80 },
      { BATCH_SOURCE: 'Web Submission', TOTAL_COUNT: 40 },
    ];

    // Render three donut charts
    this.renderPieChart(dummyData, 'donutChart1', '$4M', '#12');
    this.renderPieChart(dummyData, 'donutChart2', '$321M', '#277');
    this.renderPieChart(dummyData, 'donutChart3', '13.3M', '#123');
  }

  onSearch(): void {
    const trimmedValue = this.searchValue.trim();
    // if (!trimmedValue || this.o2cConnectorData.length === 0) return;

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
          console.log(data);
          const orderIds = [
            ...new Set(data.map((r) => r.WEBORDER_ID).filter(Boolean)),
          ];
          const subRefIds = [
            ...new Set(data.map((r) => r.SUBSCRIPTION_REF_ID).filter(Boolean)),
          ];
          const trxNumbers = [
            ...new Set(data.map((r) => r.TRX_NUMBER).filter(Boolean)),
          ];
          this.router.navigate(['/o2c-360'], {
            queryParams: {
              searchType: this.searchType,
              orderId: orderIds[0],
              subRefIds: subRefIds.join(','),
              invoiceIds: trxNumbers.join(','),
            },
          });
        },
        error: (err) => console.error('Error logging search:', err),
      });

    let matchingRows: any[] = [];

    switch (this.searchType) {
      case 'order':
        matchingRows = this.o2cConnectorData.filter(
          (row) => row.WEBORDER_ID === trimmedValue
        );
        break;
      case 'subscription':
        matchingRows = this.o2cConnectorData.filter(
          (row) => row.SUBSCRIPTION_REF_ID === trimmedValue
        );
        break;
      case 'invoice':
        matchingRows = this.o2cConnectorData.filter(
          (row) => row.TRX_NUMBER === trimmedValue
        );
        break;
      default:
        console.warn('Unknown searchType');
        return;
    }

    if (matchingRows.length === 0) {
      console.warn('No results found for search:', trimmedValue);
      return;
    }

    // console.log('Order IDs:', orderIds);
    // console.log('Subscription Ref IDs:', subRefIds);
    // console.log('Invoice (TRX) Numbers:', trxNumbers);
  }

  customLegend: { label: string; color: string }[] = [];

  renderPieChart(
    data: { BATCH_SOURCE: string; TOTAL_COUNT: number }[],
    canvasId: string,
    centerTextOverride?: string,
    subtitleText?: string
  ): void {
    const pieColors = [
      'rgba(54, 162, 235, 0.6)', // Blue
      'rgba(100, 255, 218, 0.6)', // Mint
      'rgba(255, 99, 132, 0.6)', // Red-pink
      'rgba(255, 159, 64, 0.6)', // Orange
      'rgba(153, 102, 255, 0.6)', // Purple
      'rgba(75, 192, 192, 0.6)', // Teal
      'rgba(235, 154, 229, 0.6)', // Muted pink-purple
      'rgba(201, 203, 207, 0.6)', // Gray
      'rgba(0, 255, 157, 0.6)', // Lime
      'rgba(255, 205, 86, 0.6)', // Yellow
    ];

    const labels = data.map(
      (entry) => `${entry.TOTAL_COUNT.toLocaleString()} - ${entry.BATCH_SOURCE}`
    );
    const counts = data.map((entry) => entry.TOTAL_COUNT);
    const colors = data.map((_, index) => pieColors[index % pieColors.length]);

    const ctx = (
      document.getElementById(canvasId) as HTMLCanvasElement
    )?.getContext('2d');

    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: counts,
              backgroundColor: colors,
              borderWidth: 0,
              hoverOffset: 0,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            datalabels: { display: false },
          },
          hover: { mode: null },
          animation: {
            animateRotate: false,
            animateScale: false,
          },
        },
        plugins: [
          {
            id: 'centerText',
            beforeDraw(chart) {
              const { width, height, ctx } = chart;
              const centerText =
                centerTextOverride ||
                counts.reduce((a, b) => a + b, 0).toString();
              const subtitle = subtitleText;

              ctx.save();

              // Main center text
              ctx.font = 'bold 24px Inter, sans-serif';
              ctx.fillStyle = '#333';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              // If there's a subtitle, adjust the main text position slightly up
              const mainTextY = subtitle ? height / 2 - 10 : height / 2;
              ctx.fillText(centerText, width / 2, mainTextY);

              // Subtitle text
              if (subtitle) {
                ctx.font = '14px Inter, sans-serif';
                ctx.fillStyle = '#666';
                ctx.fillText(subtitle, width / 2, height / 2 + 15);
              }

              ctx.restore();
            },
          },
        ],
      });

      // Set custom legend
      this.customLegend = labels.map((label, i) => ({
        label,
        color: colors[i],
      }));
    } else {
      console.error(`Canvas with id ${canvasId} not found`);
    }
  }
}

interface ChartOptionsWithCenterText extends ChartOptions<'doughnut'> {
  centerText?: {
    display: boolean;
    text: string;
  };
}
