import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Wd0HistoricalDataComponent } from './wd0-historical-data.component';

describe('Wd0HistoricalDataComponent', () => {
  let component: Wd0HistoricalDataComponent;
  let fixture: ComponentFixture<Wd0HistoricalDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Wd0HistoricalDataComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Wd0HistoricalDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
