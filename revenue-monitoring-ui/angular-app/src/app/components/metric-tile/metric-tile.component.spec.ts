import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricTileComponent } from './metric-tile.component';

describe('MetricTileComponent', () => {
  let component: MetricTileComponent;
  let fixture: ComponentFixture<MetricTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricTileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MetricTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
