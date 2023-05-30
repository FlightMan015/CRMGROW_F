import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from 'src/app/services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DealStage } from 'src/app/models/deal-stage.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-deal-stage-delete',
  templateUrl: './deal-stage-delete.component.html',
  styleUrls: ['./deal-stage-delete.component.scss']
})
export class DealStageDeleteComponent implements OnInit {
  stages: any[] = [];
  selectedstage: DealStage = new DealStage();
  targetStage = '';
  saving = false;

  constructor(
    private dealsService: DealsService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<DealStageDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.dealsService.stages$.subscribe((res) => {
      this.stages = [...this.stages, ...res];
      if (this.data.deleteId == this.stages[0]._id) {
        this.targetStage = this.stages[1]._id;
      } else {
        this.targetStage = this.stages[0]._id;
      }
      this.stages.forEach((stage) => {
        if (stage._id == this.data.deleteId) {
          this.selectedstage = stage;
        }
      });
    });
  }

  moveDeal(): void {
    this.saving = true;
    this.dealsService
      .deleteStage(this.data.deleteId, this.targetStage)
      .subscribe((res) => {
        this.saving = false;
        if (res) {
          // this.toastr.success(
          //   'Deal Stage has been deleted and associated contacts has been moved to a different stage.'
          // );
          this.dialogRef.close(this.targetStage);
        }
      });
  }
}
