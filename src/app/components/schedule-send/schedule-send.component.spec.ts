import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleSendComponent } from './schedule-send.component';

describe('ScheduleSendComponent', () => {
  let component: ScheduleSendComponent;
  let fixture: ComponentFixture<ScheduleSendComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScheduleSendComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(4);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
