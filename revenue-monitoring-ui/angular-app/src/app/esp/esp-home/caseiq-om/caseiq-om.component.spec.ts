import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';

import { CaseiqOmComponent } from './caseiq-om.component';

describe('CaseiqOmComponent', () => {
  let component: CaseiqOmComponent;
  let fixture: ComponentFixture<CaseiqOmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CaseiqOmComponent,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
      providers: [DestroyManager],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseiqOmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
