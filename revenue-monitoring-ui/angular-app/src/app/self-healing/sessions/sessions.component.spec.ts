import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionsComponent } from './sessions.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SessionsComponent', () => {
  let component: SessionsComponent;
  let fixture: ComponentFixture<SessionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionsComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default searchQuery and pagination', () => {
    expect(component.searchQuery).toBe('');
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(25);
  });
});
