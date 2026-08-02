import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DestroyManager } from '../../providers/destroy-manager.service';

import { O2cSearchComponent } from './o2c-search.component';

describe('O2cSearchComponent', () => {
  let component: O2cSearchComponent;
  let fixture: ComponentFixture<O2cSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        O2cSearchComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [DestroyManager],
    }).compileComponents();

    fixture = TestBed.createComponent(O2cSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
