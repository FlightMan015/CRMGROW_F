import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealStageUpdateComponent } from './deal-stage-update.component';

describe('DealStageUpdateComponent', () => {
  let component: DealStageUpdateComponent;
  let fixture: ComponentFixture<DealStageUpdateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DealStageUpdateComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealStageUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
