import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyAccountComponent } from './buy-account.component';

describe('BuyAccountComponent', () => {
  let component: BuyAccountComponent;
  let fixture: ComponentFixture<BuyAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
