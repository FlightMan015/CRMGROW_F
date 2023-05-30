/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { InputContactChipComponent } from './input-contact-chip.component';

describe('InputContactChipComponent', () => {
  let component: InputContactChipComponent;
  let fixture: ComponentFixture<InputContactChipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputContactChipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputContactChipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
