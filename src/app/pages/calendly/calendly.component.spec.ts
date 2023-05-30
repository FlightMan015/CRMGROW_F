import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendlyComponent } from './calendly.component';

describe('CalendlyComponent', () => {
  let component: CalendlyComponent;
  let fixture: ComponentFixture<CalendlyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CalendlyComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
