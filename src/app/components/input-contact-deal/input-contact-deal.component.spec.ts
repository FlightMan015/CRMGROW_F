import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputContactDealComponent } from './input-contact-deal.component';

describe('InputContactDealComponent', () => {
  let component: InputContactDealComponent;
  let fixture: ComponentFixture<InputContactDealComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputContactDealComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputContactDealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
