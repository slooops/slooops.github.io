import { ComponentFixture, TestBed } from '@angular/core/testing';
import { O2cEmbedComponent } from './o2c-embed.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('O2cEmbedComponent', () => {
  let component: O2cEmbedComponent;
  let fixture: ComponentFixture<O2cEmbedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [O2cEmbedComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(O2cEmbedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have loading or error state initially', () => {
    expect(component.loading === true || component.error === true).toBeTrue();
  });
});
