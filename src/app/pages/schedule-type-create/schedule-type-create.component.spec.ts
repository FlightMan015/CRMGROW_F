import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleTypeCreateComponent } from './schedule-type-create.component';

describe('ScheduleTypeCreateComponent', () => {
  let component: ScheduleTypeCreateComponent;
  let fixture: ComponentFixture<ScheduleTypeCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScheduleTypeCreateComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduleTypeCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
