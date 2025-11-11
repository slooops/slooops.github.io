import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtmfTableComponent } from './atmf-table.component';

describe('AtmfTableComponent', () => {
  let component: AtmfTableComponent;
  let fixture: ComponentFixture<AtmfTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtmfTableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AtmfTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
