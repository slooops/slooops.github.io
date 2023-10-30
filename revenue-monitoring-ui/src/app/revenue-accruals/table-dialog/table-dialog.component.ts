import { SelectionModel } from '@angular/cdk/collections';
import {
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-table-dialog',
  templateUrl: './table-dialog.component.html',
  styleUrls: ['./table-dialog.component.css'],
})
export class TableDialogComponent implements AfterViewInit, OnInit {
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[];
  title: string;
  length: any;
  model: any;

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('paginator') paginator: MatPaginator;

  constructor(
    public dialogRef: MatDialogRef<TableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.setData();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  setData() {
    this.dataSource = this.data.dataSource;
    this.displayedColumns = this.data.displayedColumns;
    this.title = this.data.title;
    this.length = this.data.length;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  formatColumnHeader(columnName: string): string {
    return columnName.replace(/_/g, ' ');
  }

  selection = new SelectionModel<any>(true, []);
  selectedData: any;

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  onRowClicked(row: any) {
    this.selectedData = row;
  }
}
