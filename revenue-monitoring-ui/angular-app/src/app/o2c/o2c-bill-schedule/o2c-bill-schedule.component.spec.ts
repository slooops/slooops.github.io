import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe, Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { O2cBillScheduleComponent } from './o2c-bill-schedule.component';

describe('O2cBillingScheduleComponent', () => {
  let component: O2cBillScheduleComponent;
  let fixture: ComponentFixture<O2cBillScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        DestroyManager,
        DatePipe,
        {
          provide: Location,
          useValue: { getState: () => ({}), subscribe: () => ({}) },
        },
      ],
      imports: [O2cBillScheduleComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(O2cBillScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
