import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskRecurringDialogComponent } from './task-recurring-dialog.component';

describe('CalendarRecurringDialogComponent', () => {
  let component: TaskRecurringDialogComponent;
  let fixture: ComponentFixture<TaskRecurringDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TaskRecurringDialogComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskRecurringDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
