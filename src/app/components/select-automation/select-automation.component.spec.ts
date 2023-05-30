import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectAutomationComponent } from './select-automation.component';

describe('SelectAutomationComponent', () => {
  let component: SelectAutomationComponent;
  let fixture: ComponentFixture<SelectAutomationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectAutomationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
