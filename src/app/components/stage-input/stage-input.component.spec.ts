import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StageInputComponent } from './stage-input.component';

describe('StageInputComponent', () => {
  let component: StageInputComponent;
  let fixture: ComponentFixture<StageInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StageInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
