import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadCaptureFormComponent } from './lead-capture-form.component';

describe('LeadCaptureFormComponent', () => {
  let component: LeadCaptureFormComponent;
  let fixture: ComponentFixture<LeadCaptureFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeadCaptureFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadCaptureFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
