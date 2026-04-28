import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { OrderLifecycleRevSummaryComponent } from './order-lifecycle-rev-summary.component';

describe('OrderLifecycleRevSummaryComponent', () => {
  let component: OrderLifecycleRevSummaryComponent;
  let fixture: ComponentFixture<OrderLifecycleRevSummaryComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<OrderLifecycleRevSummaryComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        OrderLifecycleRevSummaryComponent,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderLifecycleRevSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
