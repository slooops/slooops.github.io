import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GlobalSearchDialogComponent } from './global-search-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('GlobalSearchDialogComponent', () => {
  let component: GlobalSearchDialogComponent;
  let fixture: ComponentFixture<GlobalSearchDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<GlobalSearchDialogComponent>>;
  const mockDataSource = new MatTableDataSource<any>([]);

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [GlobalSearchDialogComponent, BrowserAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { dataSource: mockDataSource, displayedColumns: [] },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalSearchDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have injected displayedColumns', () => {
    expect(component.displayedColumns).toEqual([]);
  });

  it('should close dialog on close()', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
