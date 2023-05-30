import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialTimelinesComponent } from './material-timelines.component';

describe('MaterialTimelinesComponent', () => {
  let component: MaterialTimelinesComponent;
  let fixture: ComponentFixture<MaterialTimelinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MaterialTimelinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MaterialTimelinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
