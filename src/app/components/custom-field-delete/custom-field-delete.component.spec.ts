import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomFieldDeleteComponent } from './custom-field-delete.component';

describe('CustomFieldDeleteComponent', () => {
  let component: CustomFieldDeleteComponent;
  let fixture: ComponentFixture<CustomFieldDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomFieldDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomFieldDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
