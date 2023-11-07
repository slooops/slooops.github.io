import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MidcloseComponent } from './midclose.component';

describe('MidcloseComponent', () => {
  let component: MidcloseComponent;
  let fixture: ComponentFixture<MidcloseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MidcloseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MidcloseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
