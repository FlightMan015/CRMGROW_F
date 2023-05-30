import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmRemoveAutomationComponent } from './confirm-remove-automation.component';

describe('DealStageCreateComponent', () => {
  let component: ConfirmRemoveAutomationComponent;
  let fixture: ComponentFixture<ConfirmRemoveAutomationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmRemoveAutomationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmRemoveAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
