import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CaptureFieldAddComponent } from './capture-field-add.component';

describe('CaptureFieldAddComponent', () => {
  let component: CaptureFieldAddComponent;
  let fixture: ComponentFixture<CaptureFieldAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CaptureFieldAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaptureFieldAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
