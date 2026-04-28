import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';

import { O2cViewAllComponent } from './o2c-view-all.component';

describe('O2cViewAllComponent', () => {
  let component: O2cViewAllComponent;
  let fixture: ComponentFixture<O2cViewAllComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cViewAllComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        {
          provide: Location,
          useValue: { getState: () => ({}) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(O2cViewAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
