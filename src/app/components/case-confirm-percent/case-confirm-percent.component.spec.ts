import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseConfirmPercentComponent } from './case-confirm-percent.component';

describe('CaseConfirmComponent', () => {
  let component: CaseConfirmPercentComponent;
  let fixture: ComponentFixture<CaseConfirmPercentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CaseConfirmPercentComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CaseConfirmPercentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
