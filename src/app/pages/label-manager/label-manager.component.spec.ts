import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelManagerComponent } from './label-manager.component';

describe('LabelManagerComponent', () => {
  let component: LabelManagerComponent;
  let fixture: ComponentFixture<LabelManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabelManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
