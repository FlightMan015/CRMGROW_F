import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialerReportComponent } from './dialer-report.component';

describe('DialerReportComponent', () => {
  let component: DialerReportComponent;
  let fixture: ComponentFixture<DialerReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialerReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialerReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
