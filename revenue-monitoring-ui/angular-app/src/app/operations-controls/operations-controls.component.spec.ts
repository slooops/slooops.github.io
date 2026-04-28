import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { OperationsControlsComponent } from './operations-controls.component';

describe('OperationsControlsComponent', () => {
  let component: OperationsControlsComponent;
  let fixture: ComponentFixture<OperationsControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        OperationsControlsComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperationsControlsComponent);
    component = fixture.componentInstance;
    component.periodInfo.set({
      periodName: '',
      periodEndDate: '',
      lastUpdated: '',
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
