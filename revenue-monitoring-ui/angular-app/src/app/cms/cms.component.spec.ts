import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmsComponent } from './cms.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('CmsComponent', () => {
  let component: CmsComponent;
  let fixture: ComponentFixture<CmsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CmsComponent,
        HttpClientTestingModule,
        MatDialogModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
