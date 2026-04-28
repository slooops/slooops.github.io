import { ComponentFixture, TestBed } from '@angular/core/testing';
import { O2cNavComponent } from './o2c-nav.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('O2cNavComponent', () => {
  let component: O2cNavComponent;
  let fixture: ComponentFixture<O2cNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cNavComponent, RouterTestingModule, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(O2cNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default search values', () => {
    expect(component.searchValue).toBe('');
    expect(component.searchType).toBe('order');
  });

  it('should have correct columnMap entries', () => {
    expect(component.columnMap['order']).toBe('WEBORDER_ID');
    expect(component.columnMap['subscription']).toBe('SUBSCRIPTION_REF_ID');
    expect(component.columnMap['invoice']).toBe('TRX_NUMBER');
  });
});
