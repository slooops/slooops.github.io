import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { CaseiqTableComponent } from '../../components/caseiq-table/caseiq-table.component';

export interface GlobalSearchDialogData {
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[];
}

@Component({
  selector: 'app-global-search-dialog',
  templateUrl: './global-search-dialog.component.html',
  styleUrls: ['./global-search-dialog.component.css'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, CaseiqTableComponent],
})
export class GlobalSearchDialogComponent {
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[];

  // Static configuration for the embedded CaseIQ table
  exportFileName = 'Global Search Results';
  source = 'GLOBAL_SEARCH';
  // Make summary-like fields wider if present
  extraWideColumns: string[] = [
    'LLM_SUMMARY',
    'INCIDENT_DESCRIPTION',
    'RESOLUTION_NOTES',
    'COMMENTS',
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GlobalSearchDialogData,
    private dialogRef: MatDialogRef<GlobalSearchDialogComponent>
  ) {
    this.dataSource = data.dataSource;
    this.displayedColumns = data.displayedColumns;
  }

  close(): void {
    this.dialogRef.close();
  }
}
