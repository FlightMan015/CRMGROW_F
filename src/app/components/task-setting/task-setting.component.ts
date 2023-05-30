import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Garbage } from 'src/app/models/garbage.model';
import { UserService } from 'src/app/services/user.service';
import * as _ from 'lodash';
import { ScheduleService } from 'src/app/services/schedule.service';
@Component({
  selector: 'app-task-setting',
  templateUrl: './task-setting.component.html',
  styleUrls: ['./task-setting.component.scss']
})
export class TaskSettingComponent implements OnInit {
  submitted = false;
  saving = false;

  task_setting = {
    schedule_email: false,
    schedule_text: false,
    schedule_meeting: false,
    default_scheduler: null
  };

  constructor(
    public dialogRef: MatDialogRef<TaskSettingComponent>,
    private userService: UserService,
    public scheduleService: ScheduleService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.userService.garbage$.subscribe((res) => {
      const garbage = new Garbage().deserialize(res);
      this.task_setting = JSON.parse(JSON.stringify(garbage.task_setting));
    });
    this.scheduleService.getEventTypes(true);
  }

  ngOnInit(): void {}

  selectEventType($event): void {
    this.task_setting.default_scheduler = $event?._id;
  }

  save(): void {
    if (
      this.task_setting.schedule_meeting &&
      !this.task_setting.default_scheduler
    ) {
      return;
    }

    const data = {
      task_setting: {
        ...this.task_setting,
        default_scheduler: this.task_setting.schedule_meeting
          ? this.task_setting.default_scheduler
          : null
      }
    };
    this.saving = true;
    this.userService.updateGarbage(data).subscribe((res) => {
      if (res) {
        this.userService.updateGarbageImpl(data);
        this.saving = false;
        this.dialogRef.close(true);
      }
    });
  }
}
