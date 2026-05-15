import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExceptionsComponent } from './exceptions.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ExceptionsComponent', () => {
  let component: ExceptionsComponent;
  let fixture: ComponentFixture<ExceptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExceptionsComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ExceptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.searchQuery).toBe('');
    expect(component.selectedModes).toEqual([]);
    expect(component.selectedStatuses).toEqual([]);
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(25);
  });

  it('should emit viewException when event is emitted', () => {
    const spy = jasmine.createSpy('viewException');
    component.viewException.subscribe(spy);
    component.viewException.emit('run-123');
    expect(spy).toHaveBeenCalledWith('run-123');
  });
});
