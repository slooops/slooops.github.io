import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtmfCardComponent } from './atmf-card.component';

describe('AtmfCardComponent', () => {
  let component: AtmfCardComponent;
  let fixture: ComponentFixture<AtmfCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtmfCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtmfCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
