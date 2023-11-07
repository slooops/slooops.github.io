import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardArExceptionsComponent } from './standard-ar-exceptions.component';

describe('StandardArExceptionsComponent', () => {
  let component: StandardArExceptionsComponent;
  let fixture: ComponentFixture<StandardArExceptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StandardArExceptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StandardArExceptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
