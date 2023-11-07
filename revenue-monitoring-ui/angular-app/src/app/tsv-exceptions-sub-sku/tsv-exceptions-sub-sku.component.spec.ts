import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TsvExceptionsSubSkuComponent } from './tsv-exceptions-sub-sku.component';

describe('TsvExceptionsSubSkuComponent', () => {
  let component: TsvExceptionsSubSkuComponent;
  let fixture: ComponentFixture<TsvExceptionsSubSkuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TsvExceptionsSubSkuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TsvExceptionsSubSkuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
