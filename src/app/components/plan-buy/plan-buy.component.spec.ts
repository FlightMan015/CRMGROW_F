import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanBuyComponent } from './plan-buy.component';

describe('PlanBuyComponent', () => {
  let component: PlanBuyComponent;
  let fixture: ComponentFixture<PlanBuyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlanBuyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlanBuyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
