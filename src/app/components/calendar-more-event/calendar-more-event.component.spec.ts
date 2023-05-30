import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarMoreEventComponent } from './calendar-more-event.component';

describe('CalendarMoreEventComponent', () => {
  let component: CalendarMoreEventComponent;
  let fixture: ComponentFixture<CalendarMoreEventComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendarMoreEventComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarMoreEventComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
