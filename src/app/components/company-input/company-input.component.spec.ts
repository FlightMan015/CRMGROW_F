import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyInputComponent } from './company-input.component';

describe('CompanyInputComponent', () => {
  let component: CompanyInputComponent;
  let fixture: ComponentFixture<CompanyInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
