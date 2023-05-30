import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Deal } from 'src/app/models/deal.model';
import { DealsService } from 'src/app/services/deals.service';

@Component({
  selector: 'app-deal-move',
  templateUrl: './deal-move.component.html',
  styleUrls: ['./deal-move.component.scss']
})
export class DealMoveComponent implements OnInit {
  dealId = '';
  stages: any[] = [];
  selectedStage;
  selectedStageId = '';
  saving = false;

  stageLoadSubscription: Subscription;
  loadSubscription: Subscription;

  constructor(
    private dialogRef: MatDialogRef<DealMoveComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dealsService: DealsService
  ) {
    if (this.data) {
      this.selectedStageId = this.data.stage_id;
      this.dealId = this.data.deal_id;
    }

    this.stageLoadSubscription = this.dealsService.stages$.subscribe((res) => {
      this.stages = res;
      this.changeSelectedStage();
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stageLoadSubscription && this.stageLoadSubscription.unsubscribe();
  }

  changeSelectedStage(): void {
    this.stages.some((e) => {
      if (e._id === this.selectedStageId) {
        this.selectedStage = e;
      }
    });
  }

  changeDeal(stage): void {
    this.selectedStage = stage;
    this.selectedStageId = stage._id;
  }

  moveDeal(): void {
    this.saving = true;
    const data = {
      deal_id: this.dealId,
      position: this.selectedStage.deals.length,
      deal_stage_id: this.selectedStage._id
    };
    this.dealsService.moveDeal(data).subscribe((res) => {
      this.saving = false;
      this.dialogRef.close(this.selectedStageId);
    });
  }
}
