import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealAutomationComponent } from './deal-automation.component';

describe('DealTimeDurationComponent', () => {
  let component: DealAutomationComponent;
  let fixture: ComponentFixture<DealAutomationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DealAutomationComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
