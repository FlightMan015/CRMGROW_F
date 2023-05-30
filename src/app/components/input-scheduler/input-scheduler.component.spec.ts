import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputSchedulerComponent } from './input-scheduler.component';

describe('DateInputComponent', () => {
  let component: InputSchedulerComponent;
  let fixture: ComponentFixture<InputSchedulerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InputSchedulerComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputSchedulerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
