import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrls: ['./table-cell.component.css'],
  standalone: true,
})
export class TableCellComponent {
  @Input() align: 'left' | 'center' | 'right' = 'left';
}
