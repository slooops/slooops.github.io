import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';

import { CaseiqFppComponent } from './caseiq-fpp.component';

describe('CaseiqFppComponent', () => {
  let component: CaseiqFppComponent;
  let fixture: ComponentFixture<CaseiqFppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CaseiqFppComponent,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
      providers: [DestroyManager],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseiqFppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
