import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { O2cSidebarNavComponent } from './o2c-sidebar-nav.component';

describe('O2cSidebarNavComponent', () => {
  let component: O2cSidebarNavComponent;
  let fixture: ComponentFixture<O2cSidebarNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cSidebarNavComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(O2cSidebarNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
