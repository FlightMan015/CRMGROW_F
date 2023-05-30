import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  resolveForwardRef
} from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { REPEAT_DURATIONS, TIMES } from 'src/app/constants/variable.constants';
import { Task, TaskDetail } from 'src/app/models/task.model';
import { HandlerService } from 'src/app/services/handler.service';
import { StoreService } from 'src/app/services/store.service';
import { TaskService } from 'src/app/services/task.service';
import * as moment from 'moment';
import 'moment-timezone';
import { UserService } from 'src/app/services/user.service';
import { HelperService } from 'src/app/services/helper.service';
import { getCurrentTimezone, numPad } from 'src/app/helper';
import { TaskDeleteComponent } from '../task-delete/task-delete.component';
import { DealsService } from 'src/app/services/deals.service';
import { ToastrService } from 'ngx-toastr';
import { TaskRecurringDialogComponent } from '../task-recurring-dialog/task-recurring-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'app-task-edit',
  templateUrl: './task-edit.component.html',
  styleUrls: ['./task-edit.component.scss']
})
export class TaskEditComponent implements OnInit {
  REPEAT_DURATIONS = REPEAT_DURATIONS;
  TIMES = TIMES;
  MIN_DATE = {};

  date;
  time = '12:00:00.000';
  task = new TaskDetail();
  contact_id;

  timezone;
  type = '';
  deal = '';
  updating = false;
  updateSubscription: Subscription;
  deleting = false;

  selectedTimezone = moment.tz.guess();

  constructor(
    private taskService: TaskService,
    private handlerService: HandlerService,
    private userService: UserService,
    private helperService: HelperService,
    private dealsService: DealsService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<TaskEditComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    const current = new Date();
    this.MIN_DATE = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate() - 1
    };

    if (this.data) {
      if (this.data.type === 'deal') {
        this.type = 'deal';
        if (this.data.deal) {
          this.deal = this.data.deal;
        }
      }
      if (this.data.task) {
        this.task = this.task.deserialize(this.data.task);
        if (this.task.timezone) {
          this.selectedTimezone = this.task.timezone;
        }
        this.initTime();
      }
      if (this.data.contact) {
        this.contact_id = this.data.contact;
      }
    }
  }

  initTime(): void {
    const myTime = moment(this.task.due_date);
    const hour = myTime.get('hour');
    const min = myTime.get('minute');
    const hour_s = hour < 10 ? '0' + hour : hour;
    const min_s = min < 10 ? '0' + min : min;
    const time = `${hour_s}:${min_s}:00.000`;
    const dateTimeObj = {
      year: myTime.get('year'),
      month: myTime.get('month') + 1,
      day: myTime.get('date'),
      time: time
    };
    this.date = {
      year: dateTimeObj.year,
      month: dateTimeObj.month,
      day: dateTimeObj.day
    };
    this.time = dateTimeObj.time;
  }

  ngOnInit(): void {}

  toggleRepeatSetting(): void {
    this.task.recurrence_mode = this.task.recurrence_mode || 'DAILY';
    this.task.set_recurrence = !this.task.set_recurrence;
  }

  deleteTask(): void {
    if (this.data.task.set_recurrence) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'Delete the recurring task.'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (!res) {
            return;
          }
          const include_recurrence = res.type == 'all';

          this.deleting = true;
          if (this.type === 'deal') {
            this.dealsService
              .removeFollowUp({ followup: this.task, include_recurrence })
              .subscribe((status) => {
                this.deleting = false;
                if (status) {
                  this.dialogRef.close({
                    status: 'deleted',
                    deleted_all: include_recurrence
                  });
                }
              });
          } else {
            this.taskService
              .archive([this.task], include_recurrence)
              .subscribe((status) => {
                this.deleting = false;
                if (status) {
                  this.handlerService.reload$('tasks');
                  this.dialogRef.close({
                    status: 'deleted',
                    deleted_all: include_recurrence
                  });
                  // this.toastr.success('', 'Task(s) were archived successfully.');
                }
              });
          }
        });
    } else {
      const dialog = this.dialog.open(TaskDeleteComponent, {
        data: {
          follow_ups: [this.task],
          type: this.type
        }
      });

      dialog.afterClosed().subscribe((res) => {
        if (res && res.status) {
          this.type !== 'deal' && this.handlerService.reload$('tasks');
          // this.toastr.success('', 'Task(s) were archived successfully.');
          this.dialogRef.close({ status: 'deleted', deleted_all: false });
        }
      });
    }
  }

  isSame() {
    const dateStr = `${this.date.year}-${numPad(this.date.month)}-${numPad(
      this.date.day
    )} ${this.time}`;
    const due_date = moment(dateStr).format();
    const isEqual =
      _.isEqual(
        _.omit(this.data.task, ['due_date']),
        _.omit(this.task, ['due_date'])
      ) && moment(this.data.task.due_date).isSame(due_date);

    return isEqual;
  }

  submit(): void {
    if (this.isSame() || !this.selectedTimezone) {
      return;
    }

    let selectOptions = [
      { value: 'one', name: 'This task' },
      { value: 'following', name: 'This and following tasks' },
      { value: 'all', name: 'All tasks' }
    ];
    if (this.task.set_recurrence) {
      const dateStr = `${this.date.year}-${this.date.month}-${this.date.day}`;
      if (this.data.task.recurrence_mode !== this.task.recurrence_mode) {
        selectOptions = [
          { value: 'following', name: 'This and following tasks' },
          { value: 'all', name: 'All tasks' }
        ];
      } else if (
        moment(this.data.task.due_date).format('YYYY-MM-DD') !==
        moment(dateStr).format('YYYY-MM-DD')
      ) {
        selectOptions = [
          { value: 'one', name: 'This task' },
          { value: 'following', name: 'This and following tasks' }
        ];
      }
    }

    if (this.data.task.set_recurrence && this.data.task.parent_follow_up) {
      if (this.task.set_recurrence) {
        this.dialog
          .open(TaskRecurringDialogComponent, {
            disableClose: true,
            data: {
              title: 'Edit the recurring task.',
              selectOptions
            }
          })
          .afterClosed()
          .subscribe((res) => {
            if (!res) {
              return;
            }
            this.updateTask(res.type);
          });
      } else {
        this.updateTask('all');
      }
    } else {
      this.updateTask();
    }
  }

  updateTask(edit_mode = 'one'): void {
    const dateStr = `${this.date.year}-${numPad(this.date.month)}-${numPad(
      this.date.day
    )} ${this.time}`;
    const due_date = moment(dateStr).format();

    const data = {
      ...this.task,
      recurrence_mode: this.task.set_recurrence
        ? this.task.recurrence_mode
        : undefined,
      due_date,
      edit_mode
    };

    if (this.type === 'deal') {
      this.updating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.dealsService
        .editFollowUp({
          ...data,
          followup: this.task._id,
          deal: this.deal,
          contact: undefined,
          _id: undefined
        })
        .subscribe((status) => {
          this.updating = false;
          if (status) {
            // this.toastr.success('Task(s) successfully updated.');
            this.dialogRef.close({ status: true, data: data });
          }
        });
    } else {
      this.updating = true;
      this.updateSubscription && this.updateSubscription.unsubscribe();
      this.updateSubscription = this.taskService
        .update(this.task._id, data)
        .subscribe((res) => {
          this.updating = false;
          if (res) {
            this.dialogRef.close();
            // this.toastr.success('Task(s) successfully updated.');
            // this.handlerService.updateTasks$([this.task._id], data);
            // this.handlerService.updateTaskInDetail$(res);
            this.handlerService.reload$('tasks');
          }
        });
    }
  }

  selectTimezone(event) {
    this.selectedTimezone = event?.tz_name;
  }

  toggleTimeSelector(event) {
    this.task.is_full = event.target.checked;
    if (this.task.is_full) {
      this.time = '00:00:00.000';
    }
  }
}
