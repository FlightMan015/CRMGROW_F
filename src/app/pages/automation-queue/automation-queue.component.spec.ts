import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomationQueueComponent } from './automation-queue.component';

describe('AutomationQueueComponent', () => {
  let component: AutomationQueueComponent;
  let fixture: ComponentFixture<AutomationQueueComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutomationQueueComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutomationQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
