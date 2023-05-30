import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseConfirmKeepComponent } from './case-confirm-keep.component';

describe('CaseConfirmKeepComponent', () => {
  let component: CaseConfirmKeepComponent;
  let fixture: ComponentFixture<CaseConfirmKeepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CaseConfirmKeepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaseConfirmKeepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
