import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarRecurringDialogComponent } from './calendar-recurring-dialog.component';

describe('CalendarRecurringDialogComponent', () => {
  let component: CalendarRecurringDialogComponent;
  let fixture: ComponentFixture<CalendarRecurringDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CalendarRecurringDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarRecurringDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
