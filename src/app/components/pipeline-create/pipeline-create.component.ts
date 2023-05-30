import { Component, Inject, OnInit } from '@angular/core';
import { DealsService } from 'src/app/services/deals.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-pipeline-create',
  templateUrl: './pipeline-create.component.html',
  styleUrls: ['./pipeline-create.component.scss']
})
export class PipelineCreateComponent implements OnInit {
  priority = 0;
  title = '';
  submitted = false;
  saving = false;
  createSubscription: Subscription;

  constructor(
    private dealsService: DealsService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<PipelineCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (this.data && this.data.priority) {
      this.priority = this.data.priority;
    }
  }

  ngOnInit(): void {}

  createPipelines(): void {
    if (this.title === '' || this.title.trim() === '') {
      return;
    } else {
      this.saving = true;
      const data = {
        title: this.title
      };
      this.dialogRef.close(data);
    }
  }
}
