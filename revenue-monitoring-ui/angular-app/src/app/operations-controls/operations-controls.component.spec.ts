import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationsControlsComponent } from './operations-controls.component';

describe('OperationsControlsComponent', () => {
  let component: OperationsControlsComponent;
  let fixture: ComponentFixture<OperationsControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationsControlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OperationsControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
