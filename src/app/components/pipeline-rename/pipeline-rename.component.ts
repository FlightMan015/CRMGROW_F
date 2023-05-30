import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from 'src/app/services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-pipeline-rename',
  templateUrl: './pipeline-rename.component.html',
  styleUrls: ['./pipeline-rename.component.scss']
})
export class PipelineRenameComponent implements OnInit {
  priority = 0;
  title = '';
  submitted = false;
  saving = false;
  createSubscription: Subscription;

  constructor(
    private dealsService: DealsService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<PipelineRenameComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.title) {
      this.title = this.data.title;
    }
  }

  ngOnInit(): void {}

  updatePipelines(): void {
    if (this.title === '' || this.title.trim() === '') {
      return;
    } else {
      this.saving = true;
      const data = {
        title: this.title
      };
      const pipeId = this.dealsService.selectedPipeline.getValue()._id;
      this.dealsService.updatePipeLine(pipeId, data).subscribe((res1) => {
        if (res1.status) {
          this.dialogRef.close(data);
        }
      });
    }
  }
}
