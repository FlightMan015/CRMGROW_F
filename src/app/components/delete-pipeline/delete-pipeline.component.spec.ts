/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DeletePipelineComponent } from './delete-pipeline.component';

describe('DeleteFolderComponent', () => {
  let component: DeletePipelineComponent;
  let fixture: ComponentFixture<DeletePipelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeletePipelineComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeletePipelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
