import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFieldAddComponent } from './custom-field-add.component';

describe('CustomFieldAddComponent', () => {
  let component: CustomFieldAddComponent;
  let fixture: ComponentFixture<CustomFieldAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomFieldAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
