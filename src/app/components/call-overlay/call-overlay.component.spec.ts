import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CallOverlayComponent } from './call-overlay.component';

describe('CallOverlayComponent', () => {
  let component: CallOverlayComponent;
  let fixture: ComponentFixture<CallOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CallOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
