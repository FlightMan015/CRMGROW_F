import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyChooseComponent } from './company-choose.component';

describe('CompanyChooseComponent', () => {
  let component: CompanyChooseComponent;
  let fixture: ComponentFixture<CompanyChooseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyChooseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyChooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
