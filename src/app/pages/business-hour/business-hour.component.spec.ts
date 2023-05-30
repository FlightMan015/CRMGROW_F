import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessHourComponent } from './business-hour.component';

describe('BusinessHourComponent', () => {
  let component: BusinessHourComponent;
  let fixture: ComponentFixture<BusinessHourComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BusinessHourComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BusinessHourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
