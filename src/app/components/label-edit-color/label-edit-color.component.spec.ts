import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LabelEditColorComponent } from './label-edit-color.component';

describe('LabelEditColorComponent', () => {
  let component: LabelEditColorComponent;
  let fixture: ComponentFixture<LabelEditColorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LabelEditColorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelEditColorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
