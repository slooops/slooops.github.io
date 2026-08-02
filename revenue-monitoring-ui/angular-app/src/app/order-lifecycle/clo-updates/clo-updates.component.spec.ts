import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { CloUpdatesComponent } from './clo-updates.component';

describe('CloUpdatesComponent', () => {
  let component: CloUpdatesComponent;
  let fixture: ComponentFixture<CloUpdatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloUpdatesComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: { close: jasmine.createSpy('close') },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CloUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
