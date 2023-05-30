import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputEventTypeComponent } from './input-event-type.component';

describe('InputAutomationComponent', () => {
  let component: InputEventTypeComponent;
  let fixture: ComponentFixture<InputEventTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [InputEventTypeComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputEventTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
