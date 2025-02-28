import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OplComponent } from './opl.component';

describe('OplComponent', () => {
  let component: OplComponent;
  let fixture: ComponentFixture<OplComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OplComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OplComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
