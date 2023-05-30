import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealMoveComponent } from './deal-move.component';

describe('DealMoveComponent', () => {
  let component: DealMoveComponent;
  let fixture: ComponentFixture<DealMoveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DealMoveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealMoveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
