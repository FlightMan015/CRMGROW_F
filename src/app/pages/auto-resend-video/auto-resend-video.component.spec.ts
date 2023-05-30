import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoResendVideoComponent } from './auto-resend-video.component';

describe('AutoResendVideoComponent', () => {
  let component: AutoResendVideoComponent;
  let fixture: ComponentFixture<AutoResendVideoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoResendVideoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoResendVideoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
