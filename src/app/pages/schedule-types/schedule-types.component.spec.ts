import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleTypesComponent } from './schedule-types.component';

describe('ScheduleTypesComponent', () => {
  let component: ScheduleTypesComponent;
  let fixture: ComponentFixture<ScheduleTypesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScheduleTypesComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
