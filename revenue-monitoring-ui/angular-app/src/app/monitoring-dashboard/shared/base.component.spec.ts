import { TestBed } from '@angular/core/testing';
import { BaseComponent } from './base.component';
import { Component } from '@angular/core';

@Component({ selector: 'test-base', template: '', standalone: true })
class TestBaseComponent extends BaseComponent {}

describe('BaseComponent', () => {
  let component: TestBaseComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestBaseComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TestBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a destroy$ subject', () => {
    expect(component['destroy$']).toBeDefined();
  });

  it('should complete destroy$ on ngOnDestroy', () => {
    const completeSpy = spyOn(component['destroy$'], 'complete').and.callThrough();
    const nextSpy = spyOn(component['destroy$'], 'next').and.callThrough();
    component.ngOnDestroy();
    expect(nextSpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
