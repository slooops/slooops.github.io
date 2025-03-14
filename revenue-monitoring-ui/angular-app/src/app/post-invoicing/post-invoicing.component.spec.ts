import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostInvoicingComponent } from './post-invoicing.component';

describe('PostInvoicingComponent', () => {
  let component: PostInvoicingComponent;
  let fixture: ComponentFixture<PostInvoicingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostInvoicingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PostInvoicingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
