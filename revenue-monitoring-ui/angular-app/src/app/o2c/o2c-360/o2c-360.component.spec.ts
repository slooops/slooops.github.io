import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { O2c360Component } from './o2c-360.component';

describe('O2c360Component', () => {
  let component: O2c360Component;
  let fixture: ComponentFixture<O2c360Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        O2c360Component,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(O2c360Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
