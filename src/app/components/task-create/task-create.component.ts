import { EventType } from './../../models/eventType.model';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { REPEAT_DURATIONS, TIMES } from 'src/app/constants/variable.constants';
import { Contact } from 'src/app/models/contact.model';
import { Task } from 'src/app/models/task.model';
import { HandlerService } from 'src/app/services/handler.service';
import { StoreService } from 'src/app/services/store.service';
import { TaskService } from 'src/app/services/task.service';
import { numPad, getCurrentTimezone } from 'src/app/helper';
import * as moment from 'moment';
import 'moment-timezone';
import { UserService } from 'src/app/services/user.service';
import { DetailActivity } from 'src/app/models/activityDetail.model';
import { DealsService } from '../../services/deals.service';
import { ContactService } from 'src/app/services/contact.service';
import { SendEmailComponent } from '../send-email/send-email.component';
import { SendTextComponent } from '../send-text/send-text.component';
import { FormControl } from '@angular/forms';
import { Garbage } from 'src/app/models/garbage.model';
@Component({
  selector: 'app-task-create',
  templateUrl: './task-create.component.html',
  styleUrls: ['./task-create.component.scss']
})
export class TaskCreateComponent implements OnInit, OnDestroy {
  REPEAT_DURATIONS = REPEAT_DURATIONS;
  TIMES = TIMES;
  MIN_DATE = {};

  date;
  time = '12:00:00.000';
  task = new Task();
  isSelected = false;
  contacts: Contact[] = [];

  saving = false;
  saveSubscription: Subscription;
  type = '';
  dealId;

  toFocus = false;
  taskCheck = false;

  formControl: FormControl = new FormControl();
  inputControl: FormControl = new FormControl();
  selectedEventType = new EventType();
  task_setting = {
    schedule_email: false,
    schedule_text: false,
    schedule_meeting: false,
    default_scheduler: null
  };
  selectedDateTime;
  selectedTimezone = moment.tz.guess();
  requiredDateTime = false;

  allDayEvent = false;

  constructor(
    private contactService: ContactService,
    private taskService: TaskService,
    private handlerService: HandlerService,
    public userService: UserService,
    private dealService: DealsService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<TaskCreateComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    const current = new Date();
    this.MIN_DATE = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };
    if (this.data && this.data.deal) {
      this.type = 'deal';
      this.dealId = this.data.deal;
    }
    if (this.data && this.data.contacts) {
      this.isSelected = true;
      this.contacts = [...this.data.contacts];
    }

    this.userService.garbage$.subscribe((res) => {
      const garbage = new Garbage().deserialize(res);
      this.task_setting = JSON.parse(JSON.stringify(garbage.task_setting));
    });

    const today = new Date();
    this.date = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
  }

  ngOnInit(): void {
    this.task.set_recurrence = false;
    this.task.recurrence_mode = '';
  }

  ngOnDestroy(): void {}

  toggleRepeatSetting(): void {
    this.task.recurrence_mode = this.task.recurrence_mode || 'DAILY';
    this.task.set_recurrence = !this.task.set_recurrence;
  }
  selectContact(event: Contact): void {
    if (event) {
      this.contacts = [event];
    }
  }
  removeContact(contact: Contact): void {
    const index = this.contacts.findIndex((item) => item._id === contact._id);
    if (index >= 0) {
      this.contacts.splice(index, 1);
    }
  }
  submit(): void {
    if (!this.contacts.length || !this.date || !this.selectedTimezone) {
      return;
    }

    let due_date;
    if (this.task.type === 'meeting') {
      if (!this.selectedDateTime) {
        return;
      }
      due_date = this.selectedDateTime;
    } else {
      const dateStr = `${this.date.year}-${numPad(this.date.month)}-${numPad(
        this.date.day
      )} ${this.time}`;
      due_date = moment.tz(dateStr, this.selectedTimezone).format();
    }

    const ids = [];
    const newContacts = [];
    this.contacts.forEach((e) => {
      if (!e._id) {
        newContacts.push(e);
      } else {
        ids.push(e._id);
      }
    });
    if (newContacts.length) {
      this.contactService.bulkCreate(newContacts).subscribe((res) => {
        if (res) {
          res['succeed'].forEach((e) => ids.push(e._id));
          this.saveTask(ids, due_date);
        }
      });
    } else {
      this.saveTask(ids, due_date);
    }
  }

  saveTask(contacts, due_date): void {
    if (this.type === 'deal') {
      const data = {
        deal: this.dealId,
        contacts,
        type: this.task.type,
        content: this.task.content,
        due_date,
        set_recurrence: this.task.set_recurrence,
        recurrence_mode: this.task.recurrence_mode,
        timezone: this.selectedTimezone,
        is_full: this.task.is_full
      };
      if (this.task_setting.schedule_email && this.task.type === 'email') {
        this.dialogRef.close();
        const data = {
          deal: this.dealId,
          contacts: this.contacts,
          subject: this.task.content,
          task_date: due_date,
          due_date: due_date,
          set_recurrence: this.task.set_recurrence,
          recurrence_mode: this.task.recurrence_mode,
          timezone: this.selectedTimezone
        };
        const sendEmailDialog = this.dialog.open(SendEmailComponent, {
          position: {
            bottom: '0px',
            right: '0px'
          },
          width: '100vw',
          panelClass: 'send-email',
          backdropClass: 'cdk-send-email',
          disableClose: false,
          data: data
        });
        sendEmailDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.dialogRef.close(res);
          }
        });
      } else if (this.task_setting.schedule_text && this.task.type == 'text') {
        this.dialogRef.close();
        const data = {
          type: 'multi',
          deal: this.dealId,
          contacts: this.contacts,
          subject: this.task.content,
          task_date: due_date,
          due_date: due_date,
          set_recurrence: this.task.set_recurrence,
          recurrence_mode: this.task.recurrence_mode,
          timezone: this.selectedTimezone
        };
        const textDialog = this.dialog.open(SendTextComponent, {
          position: {
            bottom: '0px',
            right: '0px'
          },
          width: '100vw',
          panelClass: 'send-email',
          backdropClass: 'cdk-send-email',
          disableClose: false,
          data: data
        });
        textDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.dialogRef.close(res);
          }
        });
      } else {
        this.saving = true;
        this.saveSubscription && this.saveSubscription.unsubscribe();
        this.saveSubscription = this.dealService
          .addFollowUp(data)
          .subscribe((res) => {
            this.saving = false;
            if (res) {
              this.dialogRef.close(res);
            }
          });
      }
    } else {
      if (this.task_setting.schedule_email && this.task.type === 'email') {
        this.dialogRef.close();
        const data = {
          contacts: this.contacts,
          subject: this.task.content,
          task_date: due_date,
          due_date: due_date,
          set_recurrence: this.task.set_recurrence,
          recurrence_mode: this.task.recurrence_mode,
          timezone: this.selectedTimezone
        };
        const sendEmailDialog = this.dialog.open(SendEmailComponent, {
          position: {
            bottom: '0px',
            right: '0px'
          },
          width: '100vw',
          panelClass: 'send-email',
          backdropClass: 'cdk-send-email',
          disableClose: false,
          data: data
        });
        sendEmailDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.dialogRef.close();
          }
        });
      } else if (this.task_setting.schedule_text && this.task.type == 'text') {
        this.dialogRef.close();
        const data = {
          type: 'multi',
          deal: this.dealId,
          contacts: this.contacts,
          subject: this.task.content,
          task_date: due_date,
          due_date: due_date,
          set_recurrence: this.task.set_recurrence,
          recurrence_mode: this.task.recurrence_mode,
          timezone: this.selectedTimezone
        };
        const textDialog = this.dialog.open(SendTextComponent, {
          position: {
            bottom: '0px',
            right: '0px'
          },
          width: '100vw',
          panelClass: 'send-email',
          backdropClass: 'cdk-send-email',
          disableClose: false,
          data: data
        });
        textDialog.afterClosed().subscribe((res) => {
          if (res) {
            this.dialogRef.close();
          }
        });
      } else {
        if (contacts.length > 1) {
          const data = {
            contacts,
            type: this.task.type,
            content: this.task.content,
            due_date: due_date,
            set_recurrence: this.task.set_recurrence,
            recurrence_mode: this.task.recurrence_mode,
            timezone: this.selectedTimezone,
            is_full: this.task.is_full
          };
          this.saving = true;
          this.saveSubscription && this.saveSubscription.unsubscribe();
          this.saveSubscription = this.taskService
            .bulkCreate(data)
            .subscribe((res) => {
              this.saving = false;
              if (res) {
                this.handlerService.activityAdd$(contacts, 'task');
                this.handlerService.reload$('tasks');
                this.dialogRef.close();
              }
            });
        } else {
          const data = {
            contact: contacts[0],
            type: this.task.type,
            content: this.task.content,
            due_date: due_date,
            set_recurrence: this.task.set_recurrence,
            recurrence_mode: this.task.recurrence_mode,
            timezone: this.selectedTimezone,
            is_full: this.task.is_full
          };
          this.saving = true;
          this.saveSubscription && this.saveSubscription.unsubscribe();
          this.saveSubscription = this.taskService
            .create(data)
            .subscribe((res) => {
              this.saving = false;
              if (res) {
                this.handlerService.activityAdd$(contacts, 'task');
                this.handlerService.reload$('tasks');
                this.handlerService.createTaskInDetail$(res);
                this.dialogRef.close();
              }
            });
        }
      }
    }
  }

  setFocus(): void {
    this.toFocus = true;
  }

  isFocus(): any {
    return this.toFocus;
  }

  blueAll(): void {
    this.toFocus = false;
  }

  selectEventType($event): void {
    this.selectedEventType = $event;
  }

  selectDateTime($event) {
    this.selectedDateTime = $event.datetime;
    this.selectedTimezone = $event.timezone;
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
