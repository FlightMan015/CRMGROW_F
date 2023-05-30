/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { StopShareContactComponent } from './stop-share-contact.component';

describe('StopShareContactComponent', () => {
  let component: StopShareContactComponent;
  let fixture: ComponentFixture<StopShareContactComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StopShareContactComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StopShareContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
