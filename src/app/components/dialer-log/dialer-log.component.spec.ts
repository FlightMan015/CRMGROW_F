import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialerLogComponent } from './dialer-log.component';

describe('DialerLogComponent', () => {
  let component: DialerLogComponent;
  let fixture: ComponentFixture<DialerLogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialerLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialerLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
