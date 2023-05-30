import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleSettingComponent } from './schedule-setting.component';

describe('ScheduleSettingComponent', () => {
  let component: ScheduleSettingComponent;
  let fixture: ComponentFixture<ScheduleSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScheduleSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
