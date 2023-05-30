/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TeamContactShareComponent } from './team-contact-share.component';

describe('TeamContactShareComponent', () => {
  let component: TeamContactShareComponent;
  let fixture: ComponentFixture<TeamContactShareComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TeamContactShareComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamContactShareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
