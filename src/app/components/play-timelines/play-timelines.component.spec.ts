import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayTimelinesComponent } from './play-timelines.component';

describe('PlayTimelinesComponent', () => {
  let component: PlayTimelinesComponent;
  let fixture: ComponentFixture<PlayTimelinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayTimelinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayTimelinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
