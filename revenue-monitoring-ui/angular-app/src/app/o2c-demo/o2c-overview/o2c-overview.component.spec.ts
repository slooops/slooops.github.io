import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cOverviewComponent } from './o2c-overview.component';

describe('O2cOverviewComponent', () => {
  let component: O2cOverviewComponent;
  let fixture: ComponentFixture<O2cOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cOverviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
