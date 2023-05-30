import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionCancelReasonComponent } from './subscription-cancel-reason.component';

describe('ScheduleSendComponent', () => {
  let component: SubscriptionCancelReasonComponent;
  let fixture: ComponentFixture<SubscriptionCancelReasonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SubscriptionCancelReasonComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(4);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
