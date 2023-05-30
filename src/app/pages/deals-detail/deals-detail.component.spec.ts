import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealsDetailComponent } from './deals-detail.component';

describe('DealsDetailComponent', () => {
  let component: DealsDetailComponent;
  let fixture: ComponentFixture<DealsDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DealsDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
