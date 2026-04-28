import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';

import { CaseiqI2cComponent } from './caseiq-i2c.component';

describe('CaseiqI2cComponent', () => {
  let component: CaseiqI2cComponent;
  let fixture: ComponentFixture<CaseiqI2cComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CaseiqI2cComponent,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
      providers: [DestroyManager],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseiqI2cComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
