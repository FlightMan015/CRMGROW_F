import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendlyListComponent } from './calendly-list.component';

describe('CalendlyListComponent', () => {
  let component: CalendlyListComponent;
  let fixture: ComponentFixture<CalendlyListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalendlyListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalendlyListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
