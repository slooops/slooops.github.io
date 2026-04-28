import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelfHealingComponent } from './self-healing.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SelfHealingComponent', () => {
  let component: SelfHealingComponent;
  let fixture: ComponentFixture<SelfHealingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelfHealingComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SelfHealingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default state values', () => {
    expect(component.trendData).toEqual([]);
    expect(component.trendLoading).toBeFalse();
  });
});
