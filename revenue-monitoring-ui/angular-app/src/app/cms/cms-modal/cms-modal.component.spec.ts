import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmsModalComponent } from './cms-modal.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('CmsModalComponent', () => {
  let component: CmsModalComponent;
  let fixture: ComponentFixture<CmsModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CmsModalComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CmsModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: [] },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CmsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog on onOverlayClicked', () => {
    component.onOverlayClicked();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should close dialog on onClose', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should have injected data', () => {
    expect(component.data).toEqual([]);
  });
});
