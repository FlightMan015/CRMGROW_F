import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputStageComponent } from './input-stage.component';

describe('InputStageComponent', () => {
  let component: InputStageComponent;
  let fixture: ComponentFixture<InputStageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputStageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputStageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
