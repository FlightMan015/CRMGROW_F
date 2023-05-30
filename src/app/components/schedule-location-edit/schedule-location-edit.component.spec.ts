import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleLocationEditComponent } from './schedule-location-edit.component';

describe('ScheduleLocationEditComponent', () => {
  let component: ScheduleLocationEditComponent;
  let fixture: ComponentFixture<ScheduleLocationEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScheduleLocationEditComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleLocationEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
