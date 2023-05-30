import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EmailQueueComponent } from './email-queue.component';

describe('EmailQueueComponent', () => {
  let component: EmailQueueComponent;
  let fixture: ComponentFixture<EmailQueueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EmailQueueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmailQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
