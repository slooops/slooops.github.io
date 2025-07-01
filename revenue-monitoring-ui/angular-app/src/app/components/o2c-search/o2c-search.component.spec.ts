import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cSearchComponent } from './o2c-search.component';

describe('O2cSearchComponent', () => {
  let component: O2cSearchComponent;
  let fixture: ComponentFixture<O2cSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cSearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
