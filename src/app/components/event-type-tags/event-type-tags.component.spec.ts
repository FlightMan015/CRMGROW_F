import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EventTypeAutomationComponent } from './event-type-tags.component';

describe('DealTimeDurationComponent', () => {
  let component: EventTypeAutomationComponent;
  let fixture: ComponentFixture<EventTypeAutomationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EventTypeAutomationComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EventTypeAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
