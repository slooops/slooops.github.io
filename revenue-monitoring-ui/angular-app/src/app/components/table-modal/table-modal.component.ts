import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import ExcelJS from 'exceljs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-table-modal',
  templateUrl: './table-modal.component.html',
  styleUrls: ['./table-modal.component.css'],
  imports: [CommonModule, MatTableModule],
  standalone: true,
})
export class TableModalComponent implements OnInit {
  @Input() title: string = 'Data Table';
  @Input() data: any[] = [];
  @Output() close = new EventEmitter<void>();

  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<any>();

  ngOnInit(): void {
    if (this.data?.length) {
      this.displayedColumns = Object.keys(this.data[0]);
      this.dataSource.data = this.data;
    }
  }

  removeUnderscores(text: string): string {
    return text.replace(/_/g, ' ');
  }

  async exportTableToExcel(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this.title.substring(0, 31));

    if (this.data.length > 0) {
      const headers = Object.keys(this.data[0]);
      worksheet.addRow(headers);
      this.data.forEach((row) => worksheet.addRow(headers.map((h) => row[h])));
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.title}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }
}
