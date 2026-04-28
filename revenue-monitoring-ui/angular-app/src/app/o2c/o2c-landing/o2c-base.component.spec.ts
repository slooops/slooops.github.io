import { TestBed } from '@angular/core/testing';
import { O2cBaseComponent } from './o2c-base.component';
import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Component({ selector: 'test-o2c-base', template: '', standalone: true })
class TestO2cBaseComponent extends O2cBaseComponent {
  exceptionData: any = {};
  detailTypeConfig: any = {
    orders: {
      title: 'Orders',
      dataKey: 'ordersData',
    },
  };

  loadExceptionData(dataKey: string): void {
    // no-op
  }
}

describe('O2cBaseComponent', () => {
  let component: TestO2cBaseComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestO2cBaseComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestO2cBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default state', () => {
    expect(component.showDetailView).toBeFalse();
    expect(component.currentDetailType).toBe('');
    expect(component.isOpen.length).toBe(9);
    expect(component.isOpen.every((v) => v)).toBeTrue();
  });

  it('should toggle accordion item', () => {
    component.toggleAccordion(2);
    expect(component.isOpen[2]).toBeFalse();
    component.toggleAccordion(2);
    expect(component.isOpen[2]).toBeTrue();
  });

  it('should show detail view on showDetailTable', () => {
    spyOn(component, 'loadExceptionData');
    component.showDetailTable('orders');
    expect(component.showDetailView).toBeTrue();
    expect(component.currentDetailType).toBe('orders');
  });

  it('should call loadExceptionData with correct key', () => {
    const spy = spyOn(component, 'loadExceptionData');
    component.showDetailTable('orders');
    expect(spy).toHaveBeenCalledWith('ordersData');
  });

  it('should go back and reset detail view', () => {
    component.showDetailView = true;
    component.currentDetailType = 'orders';
    component.goBack();
    expect(component.showDetailView).toBeFalse();
    expect(component.currentDetailType).toBe('');
  });

  it('should return current title from config', () => {
    component.currentDetailType = 'orders';
    expect(component.getCurrentTitle()).toBe('Orders');
  });

  it('should return default subtitle', () => {
    expect(component.getCurrentSubtitle()).toBe('Orders Entered Not Booked');
  });

  it('should return correct file name from title', () => {
    component.currentDetailType = 'orders';
    expect(component.getCurrentFileName()).toBe('O2C Orders Exceptions');
  });

  it('should return empty data source when no config', () => {
    component.currentDetailType = 'unknown';
    expect(component.getCurrentDataSource()).toBeInstanceOf(MatTableDataSource);
  });

  it('should prepare donut data by grouping hold reasons', () => {
    const raw = [
      { HOLD_REASON: 'Credit', ORDER_AMOUNT_USD: '100' },
      { HOLD_REASON: 'Credit', ORDER_AMOUNT_USD: '200' },
      { HOLD_REASON: 'Fraud', ORDER_AMOUNT_USD: '50' },
    ];
    const result = component.prepareDonutData(raw);
    expect(result.length).toBe(2);
    const credit = result.find((r: any) => r.INCIDENT_TYPE === 'Credit');
    expect(credit.INCIDENT_COUNT).toBe(2);
    expect(credit.INCIDENT_VALUE).toBe(300);
  });

  it('should handle missing HOLD_REASON as Unknown', () => {
    const raw = [{ ORDER_AMOUNT_USD: '75' }];
    const result = component.prepareDonutData(raw);
    expect(result[0].INCIDENT_TYPE).toBe('Unknown');
  });
});
