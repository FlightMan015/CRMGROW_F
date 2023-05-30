import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseConfirmComponent } from './case-confirm.component';

describe('CaseConfirmComponent', () => {
  let component: CaseConfirmComponent;
  let fixture: ComponentFixture<CaseConfirmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CaseConfirmComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaseConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
