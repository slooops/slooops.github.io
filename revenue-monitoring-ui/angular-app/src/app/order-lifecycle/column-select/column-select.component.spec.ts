import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColumnSelectComponent } from './column-select.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('ColumnSelectComponent', () => {
  let component: ColumnSelectComponent;
  let fixture: ComponentFixture<ColumnSelectComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ColumnSelectComponent>>;

  const testColumns = ['Column A', 'Column B', 'Column C'];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ColumnSelectComponent, BrowserAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: testColumns },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize selectedColumns from injected data', () => {
    expect(component.selectedColumns).toEqual(testColumns);
  });

  it('should have injected data available', () => {
    expect(component.injectData).toEqual(testColumns);
  });
});
