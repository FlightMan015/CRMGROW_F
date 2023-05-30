/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ContactShareComponent } from './contact-share.component';

describe('ContactShareComponent', () => {
  let component: ContactShareComponent;
  let fixture: ComponentFixture<ContactShareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContactShareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
