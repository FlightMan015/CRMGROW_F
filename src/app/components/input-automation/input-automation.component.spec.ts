import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputAutomationComponent } from './input-automation.component';

describe('InputAutomationComponent', () => {
  let component: InputAutomationComponent;
  let fixture: ComponentFixture<InputAutomationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputAutomationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
