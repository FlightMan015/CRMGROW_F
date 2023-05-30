import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoFollowUpComponent } from './auto-follow-up.component';

describe('AutoFollowUpComponent', () => {
  let component: AutoFollowUpComponent;
  let fixture: ComponentFixture<AutoFollowUpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoFollowUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoFollowUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
