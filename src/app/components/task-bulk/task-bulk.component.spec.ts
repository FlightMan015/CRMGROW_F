import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskBulkComponent } from './task-bulk.component';

describe('TaskBulkComponent', () => {
  let component: TaskBulkComponent;
  let fixture: ComponentFixture<TaskBulkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaskBulkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaskBulkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
