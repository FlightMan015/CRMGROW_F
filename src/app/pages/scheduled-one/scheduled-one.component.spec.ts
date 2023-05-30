import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduledOneComponent } from './scheduled-one.component';

describe('ScheduledOneComponent', () => {
  let component: ScheduledOneComponent;
  let fixture: ComponentFixture<ScheduledOneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScheduledOneComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScheduledOneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
