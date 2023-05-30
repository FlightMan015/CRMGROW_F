import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadCaptureFormAddComponent } from './lead-capture-form-add.component';

describe('LeadCaptureFormAddComponent', () => {
  let component: LeadCaptureFormAddComponent;
  let fixture: ComponentFixture<LeadCaptureFormAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeadCaptureFormAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadCaptureFormAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
