import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextTimelinesComponent } from './text-timelines.component';

describe('TextTimelinesComponent', () => {
  let component: TextTimelinesComponent;
  let fixture: ComponentFixture<TextTimelinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextTimelinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextTimelinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
