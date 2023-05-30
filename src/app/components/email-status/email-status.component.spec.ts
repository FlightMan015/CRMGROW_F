import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailStatusComponent } from './email-status.component';

describe('EmailStatusComponent', () => {
  let component: EmailStatusComponent;
  let fixture: ComponentFixture<EmailStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
