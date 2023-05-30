import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InputStateComponent } from './input-state.component';

describe('InputStateComponent', () => {
  let component: InputStateComponent;
  let fixture: ComponentFixture<InputStateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputStateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
