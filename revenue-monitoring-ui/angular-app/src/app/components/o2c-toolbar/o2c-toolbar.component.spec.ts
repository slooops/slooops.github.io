import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cToolbarComponent } from './o2c-toolbar.component';

describe('O2cToolbarComponent', () => {
  let component: O2cToolbarComponent;
  let fixture: ComponentFixture<O2cToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cToolbarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
