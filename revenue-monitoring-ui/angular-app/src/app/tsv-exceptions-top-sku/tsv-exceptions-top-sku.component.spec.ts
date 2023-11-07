import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsvExceptionsTopSkuComponent } from './tsv-exceptions-top-sku.component';

describe('TsvExceptionsTopSkuComponent', () => {
  let component: TsvExceptionsTopSkuComponent;
  let fixture: ComponentFixture<TsvExceptionsTopSkuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TsvExceptionsTopSkuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TsvExceptionsTopSkuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
