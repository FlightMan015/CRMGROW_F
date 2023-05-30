import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DealStageCreateComponent } from './deal-stage-create.component';

describe('DealStageCreateComponent', () => {
  let component: DealStageCreateComponent;
  let fixture: ComponentFixture<DealStageCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DealStageCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DealStageCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
