/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LinkContactAssignComponent } from './link-contact-assign.component';

describe('AutomationAssignComponent', () => {
  let component: LinkContactAssignComponent;
  let fixture: ComponentFixture<LinkContactAssignComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LinkContactAssignComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinkContactAssignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
