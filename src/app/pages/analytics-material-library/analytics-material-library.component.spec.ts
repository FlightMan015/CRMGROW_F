/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AnalyticsMaterialLibraryComponent } from './analytics-material-library.component';

describe('AnalyticsMaterialLibraryComponent', () => {
  let component: AnalyticsMaterialLibraryComponent;
  let fixture: ComponentFixture<AnalyticsMaterialLibraryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnalyticsMaterialLibraryComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticsMaterialLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
