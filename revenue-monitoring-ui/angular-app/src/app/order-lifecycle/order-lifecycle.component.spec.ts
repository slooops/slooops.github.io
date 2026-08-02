import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderLifecycleComponent } from './order-lifecycle.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BusinessInsightsModule } from '../business-insights/business-insights.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';

describe('OrderLifecycleComponent', () => {
  let component: OrderLifecycleComponent;
  let fixture: ComponentFixture<OrderLifecycleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BusinessInsightsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatDialogModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderLifecycleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
