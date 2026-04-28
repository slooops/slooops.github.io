import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableCellComponent } from './table-cell.component';

describe('TableCellComponent', () => {
  let component: TableCellComponent;
  let fixture: ComponentFixture<TableCellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableCellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to left alignment', () => {
    expect(component.align).toBe('left');
  });

  it('should accept center alignment', () => {
    const fixture2 = TestBed.createComponent(TableCellComponent);
    const comp2 = fixture2.componentInstance;
    comp2.align = 'center';
    fixture2.detectChanges();
    expect(comp2.align).toBe('center');
  });

  it('should accept right alignment', () => {
    const fixture2 = TestBed.createComponent(TableCellComponent);
    const comp2 = fixture2.componentInstance;
    comp2.align = 'right';
    fixture2.detectChanges();
    expect(comp2.align).toBe('right');
  });
});
