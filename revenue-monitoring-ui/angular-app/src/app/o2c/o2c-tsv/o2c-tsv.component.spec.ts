import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cTsvComponent } from './o2c-tsv.component';

describe('O2cTsvComponent', () => {
  let component: O2cTsvComponent;
  let fixture: ComponentFixture<O2cTsvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DestroyManager],
      imports: [O2cTsvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cTsvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
