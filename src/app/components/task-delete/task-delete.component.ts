import { Component, Inject, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { DealsService } from '../../services/deals.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-task-delete',
  templateUrl: './task-delete.component.html',
  styleUrls: ['./task-delete.component.scss']
})
export class TaskDeleteComponent implements OnInit {
  deleting = false;
  follow_ups = [];
  type = 'contact';
  constructor(
    private dialogRef: MatDialogRef<TaskDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskService,
    private toast: ToastrService,
    private dealsService: DealsService
  ) {
    this.follow_ups = this.data.follow_ups;
    if (this.data && this.data.type) {
      this.type = this.data.type;
    }
  }

  ngOnInit(): void {}

  delete(): void {
    this.deleting = true;
    if (this.type === 'deal') {
      this.dealsService
        .removeFollowUp({ followup: this.follow_ups[0] })
        .subscribe((status) => {
          this.deleting = false;
          if (status) {
            this.dialogRef.close({ status: true });
          }
        });
    } else {
      this.taskService.archive(this.follow_ups).subscribe((status) => {
        this.deleting = false;
        if (status) {
          this.dialogRef.close({ status: true });
          // this.toast.success('', 'Task(s) were archived successfully.', {
          //   closeButton: true
          // });
        }
      });
    }
  }
}
