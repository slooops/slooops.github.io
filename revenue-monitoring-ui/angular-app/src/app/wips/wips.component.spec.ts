import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WipsComponent } from './wips.component';

describe('WipsComponent', () => {
  let component: WipsComponent;
  let fixture: ComponentFixture<WipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WipsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
