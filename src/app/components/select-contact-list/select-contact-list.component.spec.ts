import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectContactListComponent } from './select-contact-list.component';

describe('SelectContactListComponent', () => {
  let component: SelectContactListComponent;
  let fixture: ComponentFixture<SelectContactListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectContactListComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectContactListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
