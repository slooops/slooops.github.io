import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloUpdatesComponent } from './clo-updates.component';

describe('CloUpdatesComponent', () => {
  let component: CloUpdatesComponent;
  let fixture: ComponentFixture<CloUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CloUpdatesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
