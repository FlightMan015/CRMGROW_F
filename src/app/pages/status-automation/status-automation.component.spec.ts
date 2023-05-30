import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusAutomationComponent } from './status-automation.component';

describe('StatusAutomationComponent', () => {
  let component: StatusAutomationComponent;
  let fixture: ComponentFixture<StatusAutomationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StatusAutomationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StatusAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
