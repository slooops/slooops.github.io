import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as XLSX from 'xlsx';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';

@Component({
    selector: 'app-table-modal',
    templateUrl: './table-modal.component.html',
    styleUrls: ['./table-modal.component.css'],
    imports: [
    CommonModule,
    MatTableModule
  ],
  standalone: true
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

  exportTableToExcel(): void {
    const worksheet = XLSX.utils.json_to_sheet(this.data);
    const workbook = {
      Sheets: { [this.title]: worksheet },
      SheetNames: [this.title],
    };
    XLSX.writeFile(workbook, `${this.title}.xlsx`);
  }

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }
}
