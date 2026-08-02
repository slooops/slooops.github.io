import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DestroyManager } from '../../providers/destroy-manager.service';

import { O2cLandingComponent } from './o2c-landing.component';

describe('O2cLandingComponent', () => {
  let component: O2cLandingComponent;
  let fixture: ComponentFixture<O2cLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        O2cLandingComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [DestroyManager],
    }).compileComponents();

    fixture = TestBed.createComponent(O2cLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
