import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlPostingComponent } from './gl-posting.component';

describe('GlPostingComponent', () => {
  let component: GlPostingComponent;
  let fixture: ComponentFixture<GlPostingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlPostingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GlPostingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
