import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PipelineRenameComponent } from './pipeline-rename.component';

describe('DealStageCreateComponent', () => {
  let component: PipelineRenameComponent;
  let fixture: ComponentFixture<PipelineRenameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PipelineRenameComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PipelineRenameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
