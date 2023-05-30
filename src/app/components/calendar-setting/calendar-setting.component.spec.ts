import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarSettingComponent } from './calendar-setting.component';

describe('CalendarSettingComponent', () => {
  let component: CalendarSettingComponent;
  let fixture: ComponentFixture<CalendarSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendarSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
