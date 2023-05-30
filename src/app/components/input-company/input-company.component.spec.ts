import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputCompanyComponent } from './input-company.component';

describe('InputCompanyComponent', () => {
  let component: InputCompanyComponent;
  let fixture: ComponentFixture<InputCompanyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputCompanyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
