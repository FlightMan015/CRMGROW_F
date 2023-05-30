import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialPlanComponent } from './dial-plan.component';

describe('DialPlanComponent', () => {
  let component: DialPlanComponent;
  let fixture: ComponentFixture<DialPlanComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialPlanComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
