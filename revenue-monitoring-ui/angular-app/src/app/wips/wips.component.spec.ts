import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { DestroyManager } from '../providers/destroy-manager.service';

import { WipsComponent } from './wips.component';

describe('WipsComponent', () => {
  let component: WipsComponent;
  let fixture: ComponentFixture<WipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        WipsComponent,
        CommonModule,
        HttpClientTestingModule,
        RouterTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [DestroyManager],
    }).compileComponents();

    fixture = TestBed.createComponent(WipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
