import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarOverlayComponent } from './calendar-overlay.component';

describe('CalendarOverlayComponent', () => {
  let component: CalendarOverlayComponent;
  let fixture: ComponentFixture<CalendarOverlayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendarOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendarOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
