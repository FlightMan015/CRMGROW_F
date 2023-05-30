import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateCustomInputComponent } from './date-custom-input.component';

describe('DateCustomInputComponent', () => {
  let component: DateCustomInputComponent;
  let fixture: ComponentFixture<DateCustomInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DateCustomInputComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateCustomInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
