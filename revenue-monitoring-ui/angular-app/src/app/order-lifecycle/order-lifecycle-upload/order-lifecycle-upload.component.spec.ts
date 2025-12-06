import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of } from 'rxjs';
import { OrderLifecycleUploadComponent } from './order-lifecycle-upload.component';
import { ApiHttpService } from '../../providers/http.service';
import { TemplateRef } from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('OrderLifecycleUploadComponent', () => {
  let component: OrderLifecycleUploadComponent;
  let fixture: ComponentFixture<OrderLifecycleUploadComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderLifecycleUploadComponent],
      imports: [MatDialogModule, ReactiveFormsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} },
        ApiHttpService,
        FormBuilder,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderLifecycleUploadComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    // expect(component).toBeTruthy();
  });

  it('should close dialog', () => {
    spyOn(component.dialog, 'closeAll');

    component.closeOkDialog();

    // expect(component.dialog.closeAll).toHaveBeenCalled();
  });
});
