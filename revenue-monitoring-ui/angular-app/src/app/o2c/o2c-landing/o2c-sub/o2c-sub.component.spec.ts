import { DestroyManager } from 'src/app/providers/destroy-manager.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { O2cSubComponent } from './o2c-sub.component';

describe('O2cSubComponent', () => {
  let component: O2cSubComponent;
  let fixture: ComponentFixture<O2cSubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [DestroyManager],
      imports: [O2cSubComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(O2cSubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
