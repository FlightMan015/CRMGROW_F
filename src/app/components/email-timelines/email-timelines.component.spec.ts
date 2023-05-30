import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailTimelinesComponent } from './email-timelines.component';

describe('EmailTimelinesComponent', () => {
  let component: EmailTimelinesComponent;
  let fixture: ComponentFixture<EmailTimelinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailTimelinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailTimelinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
