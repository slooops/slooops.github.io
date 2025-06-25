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
    this.route.queryParamMap.subscribe((params) => {});

    // Dummy data
    const dummyData1 = [
      { INCIDENT_TYPE: 'Order Entry', INCIDENT_VALUE: 130 },
      { INCIDENT_TYPE: 'Manual Entry', INCIDENT_VALUE: 80 },
      { INCIDENT_TYPE: 'Web Submission', INCIDENT_VALUE: 40 },
      { INCIDENT_TYPE: 'API Integration', INCIDENT_VALUE: 10 },
      { INCIDENT_TYPE: 'CSV Upload', INCIDENT_VALUE: 5 },
    ];

    const dummyData2 = [
      { INCIDENT_TYPE: 'Order Entry', INCIDENT_VALUE: 100 },
      { INCIDENT_TYPE: 'Manual Entry', INCIDENT_VALUE: 50 },
      { INCIDENT_TYPE: 'Web Submission', INCIDENT_VALUE: 30 },
    ];

    const dummyData3 = [{ INCIDENT_TYPE: 'Order Entry', INCIDENT_VALUE: 200 }];

    // Render three donut charts
    this.renderPieChart(dummyData1, 'donutChart1', '$4M', '#12');
    this.renderPieChart(dummyData2, 'donutChart2', '$321M', '#277');
    this.renderPieChart(dummyData3, 'donutChart3', '13.3M', '#123');
  }

  legendMap: { [canvasId: string]: { label: string; color: string }[] } = {};

  renderPieChart(
    data: { INCIDENT_TYPE: string; INCIDENT_VALUE: number }[],
    canvasId: string,
    centerTextOverride?: string,
    subtitleText?: string
  ): void {
    const pieColors = [
      '#399E20',
      '#FBAB2C',
      '#1990FA',
      '#00509E',
      'rgba(255, 99, 132, 0.6)', // Red-pink

      'rgba(54, 162, 235, 0.6)', // Blue
      'rgba(100, 255, 218, 0.6)', // Mint
      'rgba(255, 159, 64, 0.6)', // Orange
      'rgba(153, 102, 255, 0.6)', // Purple
      'rgba(75, 192, 192, 0.6)', // Teal
      'rgba(235, 154, 229, 0.6)', // Muted pink-purple
      'rgba(201, 203, 207, 0.6)', // Gray
      'rgba(0, 255, 157, 0.6)', // Lime
      'rgba(255, 205, 86, 0.6)', // Yellow
    ];

    const labels = data.map(
      (entry) =>
        `${entry.INCIDENT_VALUE.toLocaleString()} - ${entry.INCIDENT_TYPE}`
    );
    const counts = data.map((entry) => entry.INCIDENT_VALUE);
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
          cutout: '70%',
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
              ctx.font = '600 16px Inter, sans-serif';
              ctx.fillStyle = '#333';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              // If there's a subtitle, adjust the main text position slightly up
              const mainTextY = subtitle ? height / 2 - 2 : height / 2;
              ctx.fillText(centerText, width / 2, mainTextY);

              // Subtitle text
              if (subtitle) {
                ctx.font = '12px Inter, sans-serif';
                ctx.fillStyle = '#666';
                ctx.fillText(subtitle, width / 2, height / 2 + 12);
              }

              ctx.restore();
            },
          },
        ],
      });

      // Set custom legend
      this.legendMap[canvasId] = labels.map((label, i) => ({
        label,
        color: colors[i],
      }));
      console.log(`Legend for ${canvasId}:`, this.legendMap[canvasId]);
    } else {
      console.error(`Canvas with id ${canvasId} not found`);
    }
  }
}
