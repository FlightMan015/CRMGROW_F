import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendlyDialogComponent } from './calendly-dialog.component';

describe('CalendlyDialogComponent', () => {
  let component: CalendlyDialogComponent;
  let fixture: ComponentFixture<CalendlyDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendlyDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendlyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
