import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { DestroyManager } from 'src/app/providers/destroy-manager.service';

import { CaseiqSmComponent } from './caseiq-sm.component';

describe('CaseiqSmComponent', () => {
  let component: CaseiqSmComponent;
  let fixture: ComponentFixture<CaseiqSmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CaseiqSmComponent,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
      providers: [DestroyManager],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseiqSmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
