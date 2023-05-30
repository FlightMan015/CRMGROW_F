import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarDeclineComponent } from './calendar-decline.component';

describe('CalendarDeclineComponent', () => {
  let component: CalendarDeclineComponent;
  let fixture: ComponentFixture<CalendarDeclineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendarDeclineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarDeclineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
