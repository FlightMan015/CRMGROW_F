import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealTimeDurationComponent } from './deal-time-duration.component';

describe('DealTimeDurationComponent', () => {
  let component: DealTimeDurationComponent;
  let fixture: ComponentFixture<DealTimeDurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DealTimeDurationComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealTimeDurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
