import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealStageDeleteComponent } from './deal-stage-delete.component';

describe('DealStageDeleteComponent', () => {
  let component: DealStageDeleteComponent;
  let fixture: ComponentFixture<DealStageDeleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DealStageDeleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealStageDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
