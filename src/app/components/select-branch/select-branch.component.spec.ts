import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectBranchComponent } from './select-branch.component';

describe('SelectBranchComponent', () => {
  let component: SelectBranchComponent;
  let fixture: ComponentFixture<SelectBranchComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectBranchComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectBranchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
