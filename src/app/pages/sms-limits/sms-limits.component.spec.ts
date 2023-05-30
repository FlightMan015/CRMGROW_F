import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsLimitsComponent } from './sms-limits.component';

describe('SmsLimitsComponent', () => {
  let component: SmsLimitsComponent;
  let fixture: ComponentFixture<SmsLimitsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SmsLimitsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SmsLimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
