import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleEventTypeComponent } from './schedule-event-type.component';

describe('ScheduleEventTypeComponent', () => {
  let component: ScheduleEventTypeComponent;
  let fixture: ComponentFixture<ScheduleEventTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScheduleEventTypeComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleEventTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
