import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpDataComponent } from './help-data.component';

describe('HelpDataComponent', () => {
  let component: HelpDataComponent;
  let fixture: ComponentFixture<HelpDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HelpDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
