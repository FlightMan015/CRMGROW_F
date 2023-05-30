import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from 'src/app/services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-deal-stage-update',
  templateUrl: './deal-stage-update.component.html',
  styleUrls: ['./deal-stage-update.component.scss']
})
export class DealStageUpdateComponent implements OnInit {
  stage: any;
  title = '';
  submitted = false;
  saving = false;
  createSubscription: Subscription;

  constructor(
    private dealsService: DealsService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<DealStageUpdateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.stage) {
      this.stage = this.data.stage;
    }
  }

  ngOnInit(): void {}

  updateStages(): void {
    if (this.title === '' || this.title.trim() === '') {
      return;
    } else {
      if (this.stage.title == this.title) {
        this.dialogRef.close();
      }
      this.saving = true;
      const data = {
        title: this.title
      };
      this.dealsService.updateStage(this.stage._id, data).subscribe((res1) => {
        if (res1) {
          const stageArray = this.dealsService.stages.getValue();
          stageArray.find((e) => e._id == this.stage._id).title = this.title;
          this.dealsService.stages.next(stageArray);
          this.saving = false;
        }
        this.dialogRef.close();
      });
    }
  }
}
