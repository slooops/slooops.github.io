/// <reference types="jasmine" />
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { UploadScreenComponent } from './upload-screen.component';
import { ApiHttpService } from 'src/app/providers/http.service';
import { AuthenticationService } from 'src/app/providers/authentication.service';

describe('UploadScreenComponent', () => {
  let component: UploadScreenComponent;
  let fixture: ComponentFixture<UploadScreenComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UploadScreenComponent>>;
  let httpSpy: any;
  let authSpy: jasmine.SpyObj<AuthenticationService>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    httpSpy = jasmine.createSpyObj('ApiHttpService', ['post']);
    authSpy = jasmine.createSpyObj('AuthenticationService', ['getUserID']);
    authSpy.getUserID.and.returnValue('testuser');

    await TestBed.configureTestingModule({
      imports: [UploadScreenComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ApiHttpService, useValue: httpSpy },
        { provide: AuthenticationService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default state', () => {
    expect(component.isDragOver).toBe(false);
    expect(component.selectedFile).toBeNull();
    expect(component.isUploadSuccess).toBe(false);
    expect(component.isUploading).toBe(false);
    expect(component.username).toBe('testuser');
  });

  // ── Drag & Drop ──

  it('should set isDragOver on dragover', () => {
    const event = new DragEvent('dragover');
    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');
    component.onDragOver(event);
    expect(component.isDragOver).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should clear isDragOver on dragleave', () => {
    component.isDragOver = true;
    const event = new DragEvent('dragleave');
    spyOn(event, 'preventDefault');
    component.onDragLeave(event);
    expect(component.isDragOver).toBe(false);
  });

  // ── File Selection ──

  it('should accept a valid CSV file', () => {
    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    component.onFileSelected({ target: { files: [file] } } as any);
    expect(component.selectedFile).toBe(file);
  });

  it('should accept a valid XLSX file', () => {
    const file = new File(['data'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    component.onFileSelected({ target: { files: [file] } } as any);
    expect(component.selectedFile).toBe(file);
  });

  it('should reject an invalid file type', () => {
    spyOn(globalThis, 'alert');
    const file = new File(['data'], 'test.txt', { type: 'text/plain' });
    component.onFileSelected({ target: { files: [file] } } as any);
    expect(component.selectedFile).toBeNull();
    expect(globalThis.alert).toHaveBeenCalledWith('Please select a CSV file.');
  });

  it('should reject a file exceeding 20 MB', () => {
    spyOn(globalThis, 'alert');
    const bigContent = new ArrayBuffer(21 * 1024 * 1024);
    const file = new File([bigContent], 'big.csv', { type: 'text/csv' });
    component.onFileSelected({ target: { files: [file] } } as any);
    expect(component.selectedFile).toBeNull();
    expect(globalThis.alert).toHaveBeenCalledWith(
      'File size exceeds 20 MB limit. Please select a smaller file.',
    );
  });

  // ── Upload ──

  it('should upload file and close dialog on success', () => {
    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    component.selectedFile = file;
    httpSpy.post.and.returnValue(of('OK'));

    component.uploadFile();

    expect(component.isUploadSuccess).toBe(true);
    expect(component.isUploading).toBe(false);
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ success: true, fileName: 'test.csv' }),
    );
  });

  it('should handle upload error and close dialog', () => {
    spyOn(globalThis, 'alert');
    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    component.selectedFile = file;
    httpSpy.post.and.returnValue(throwError(() => new Error('Server error')));

    component.uploadFile();

    expect(component.isUploading).toBe(false);
    expect(globalThis.alert).toHaveBeenCalledWith(
      'Upload failed. Please try again.',
    );
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ success: false, fileName: 'test.csv' }),
    );
  });

  it('should alert if uploadFile called without a file', () => {
    spyOn(globalThis, 'alert');
    component.selectedFile = null;
    component.uploadFile();
    expect(globalThis.alert).toHaveBeenCalledWith(
      'Please select a file first.',
    );
  });

  // ── Reset ──

  it('should reset all state on resetUpload', () => {
    component.selectedFile = new File(['x'], 'x.csv');
    component.isUploadSuccess = true;
    component.isDragOver = true;
    component.isUploading = true;

    component.resetUpload();

    expect(component.selectedFile).toBeNull();
    expect(component.isUploadSuccess).toBe(false);
    expect(component.isDragOver).toBe(false);
    expect(component.isUploading).toBe(false);
  });

  // ── Format helpers ──

  it('should format file sizes correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(512)).toBe('512 Bytes');
    expect(component.formatFileSize(1024)).toBe('1 KB');
    expect(component.formatFileSize(1048576)).toBe('1 MB');
    expect(component.formatFileSize(1073741824)).toBe('1 GB');
  });

  // ── Close ──

  it('should close dialog on onClose', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
