import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DialerCallComponent } from './dialer-call.component';

describe('DialerCallComponent', () => {
  let component: DialerCallComponent;
  let fixture: ComponentFixture<DialerCallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DialerCallComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialerCallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
