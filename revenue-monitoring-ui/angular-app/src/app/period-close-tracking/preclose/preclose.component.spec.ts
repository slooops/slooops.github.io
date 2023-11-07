import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrecloseComponent } from './preclose.component';

describe('PrecloseComponent', () => {
  let component: PrecloseComponent;
  let fixture: ComponentFixture<PrecloseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrecloseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrecloseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
