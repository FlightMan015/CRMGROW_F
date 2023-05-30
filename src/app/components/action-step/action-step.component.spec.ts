import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionStepComponent } from './action-step.component';

describe('ActionStepComponent', () => {
  let component: ActionStepComponent;
  let fixture: ComponentFixture<ActionStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ActionStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
