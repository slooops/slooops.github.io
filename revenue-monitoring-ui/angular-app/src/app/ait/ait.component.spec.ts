import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AitComponent } from './ait.component';

describe('AitComponent', () => {
  let component: AitComponent;
  let fixture: ComponentFixture<AitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AitComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
