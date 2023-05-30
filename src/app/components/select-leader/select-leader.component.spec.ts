import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectLeaderComponent } from './select-leader.component';

describe('SelectLeaderComponent', () => {
  let component: SelectLeaderComponent;
  let fixture: ComponentFixture<SelectLeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectLeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectLeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
