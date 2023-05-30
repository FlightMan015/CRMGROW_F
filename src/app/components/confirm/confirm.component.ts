import { Component, OnInit, Inject, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealStage } from '../../models/deal-stage.model';
import { Pipeline } from '../../models/pipeline.model';

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {
  onOtherAction = new EventEmitter();
  onConfirmAction = new EventEmitter();
  submitting = false;
  comment: string = '';
  step = 1;
  hasDealStages = false;
  dealStages: DealStage[] = [];
  pipelines: Pipeline[] = [];
  stages: DealStage[] = [];
  selectedPipeline = null;
  pipelineStages = [];
  mapDealStage = {};
  hasMultiPipeline = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data['dealStages']) {
      this.dealStages = this.data['dealStages'];
      if (this.dealStages && this.dealStages.length > 0) {
        this.hasDealStages = true;
        const pipelineIds = this.dealStages.map((item) => item.pipe_line);
        this.hasMultiPipeline = pipelineIds.every(
          (val, i, arr) => val === arr[0]
        )
          ? false
          : true;

        for (const dealStage of this.dealStages) {
          this.mapDealStage[dealStage._id] = '';
        }
      }
    }
    if (this.data && this.data['stages']) {
      this.stages = this.data['stages'];
    }
    if (this.data && this.data['pipelines']) {
      this.pipelines = this.data['pipelines'];
      this.selectedPipeline =
        this.pipelines.length > 0 ? this.pipelines[0]._id : null;
      if (this.stages.length > 0 && this.selectedPipeline) {
        this.pipelineStages = this.stages.filter(
          (item) => item.pipe_line == this.selectedPipeline
        );
      }
    }
  }

  ngOnInit(): void {
    if (this.data.comment && this.data.comment.value) {
      this.comment = this.data.comment.value;
    }
  }

  closeWithAnswer(answer): void {
    this.dialogRef.close(answer.value);
  }

  doAdditionalAction(): void {
    this.onOtherAction.emit(new Date().getTime());
  }

  close(): void {
    if (this.data['comment']) {
      this.dialogRef.close({ comment: this.comment });
    } else {
      this.dialogRef.close(true);
    }
  }

  doConfirm(): void {
    if (this.hasDealStages) {
      const data = {};
      for (const key in this.mapDealStage) {
        data[key] = {
          dealStage: this.mapDealStage[key],
          pipeline: this.selectedPipeline
        };
      }
      this.dialogRef.close({ matchInfo: data });
    } else {
      this.onConfirmAction.emit(new Date().getTime());
    }
  }

  goNext(): void {
    this.step = 2;
  }

  onChangePipeline(): void {
    if (this.stages.length > 0 && this.selectedPipeline) {
      this.pipelineStages = this.stages.filter(
        (item) => item.pipe_line == this.selectedPipeline
      );
      for (const dealStage of this.dealStages) {
        this.mapDealStage[dealStage._id] = '';
      }
    }
  }

  onCopyPipeline(): void {
    const data = {};
    for (const key in this.mapDealStage) {
      const index = this.dealStages.findIndex((item) => item._id == key);
      if (index >= 0) {
        data[key] = {
          dealStage: this.mapDealStage[key],
          pipeline: this.dealStages[index].pipe_line
        };
      }
    }
    this.dialogRef.close({ matchInfo: data });
  }
}
