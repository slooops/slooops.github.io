import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmsSftpDetailsComponent } from './cms-sftp-details.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('CmsSftpDetailsComponent', () => {
  let component: CmsSftpDetailsComponent;
  let fixture: ComponentFixture<CmsSftpDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmsSftpDetailsComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CmsSftpDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isDataLoaded false by default', () => {
    expect(component.isDataLoaded).toBeFalse();
  });
});
