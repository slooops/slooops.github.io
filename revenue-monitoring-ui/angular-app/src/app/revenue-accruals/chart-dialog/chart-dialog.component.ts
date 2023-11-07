import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-chart-dialog',
  templateUrl: './chart-dialog.component.html',
  styleUrls: ['./chart-dialog.component.css'],
})
export class ChartDialogComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<ChartDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.chartData = this.data.chartData;
    this.chartLabels = this.data.chartLabels;
    this.chartType = this.data.chartType;
    this.chartName = this.data.chartName;
  }

  chartOptions = {
    responsive: true,
    elements: {
      line: {
        tension: 0.3,
      },
    },
  };

  chartData: any;
  chartLabels: any;
  chartType: any;
  chartName: string = '';

  closeDialog() {
    this.dialogRef.close();
  }
}
