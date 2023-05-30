import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  HOURS,
  REPEAT_DURATIONS,
  TIMES
} from 'src/app/constants/variable.constants';
import { NgbCalendar, NgbDate } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { TaskService } from '../../services/task.service';
@Component({
  selector: 'app-schedule-select',
  templateUrl: './schedule-select.component.html',
  styleUrls: ['./schedule-select.component.scss']
})
export class ScheduleSelectComponent implements OnInit {
  TIMES = TIMES;
  REPEAT_DURATIONS = REPEAT_DURATIONS;
  submitted = false;
  selected: Date | null;
  date: string;
  time = '12:00:00.000';
  set_recurrence = false;
  recurrence_mode;

  // Business Hour Setting
  timezone = moment.tz.guess();
  enabledDays = [0, 1, 2, 3, 4, 5, 6];
  startTime = HOURS[0].id;
  endTime = HOURS[23].id;

  constructor(
    private calendar: NgbCalendar,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskService,
    private dialogRef: MatDialogRef<ScheduleSelectComponent>
  ) {
    if (this.data.businessHour?.is_enabled) {
      // this.timezone = this.data.businessHour.timezone || moment.tz.guess();
      // this.enabledDays = this.data.businessHour.enabled_days || [0, 1, 2, 3, 4, 5, 6];
      if (this.data.businessHour.start_time) {
        this.startTime = this.data.businessHour.start_time;
      }
      if (this.data.businessHour.end_time) {
        this.endTime = this.data.businessHour.end_time;
      }
    }
  }

  ngOnInit(): void {
    this.initTime();
    this.recurrence_mode = 'DAILY';
  }

  getChangedValue(e): void {
    const format = 'MMM DD,YYYY';
    this.date = moment(e).format(format);
  }

  /**
   * Initialize the default date and time
   */
  initTime(): void {
    const due_date = moment().add(1, 'hour').startOf('hour');
    this.selected = due_date.toDate();
    const format = 'MMM DD,YYYY';
    this.date = due_date.format(format);
    this.time = due_date.format('HH:mm:[00.000]');
  }

  /**
   * select the scheduled time
   */
  sendSchedule() {
    const dateStr = moment(this.selected).format('YYYY-MM-DD');
    const selectedTime = moment
      .tz(dateStr + 'T' + this.time, this.timezone)
      .toDate();
    if (!this.set_recurrence) {
      this.recurrence_mode = '';
    }
    const data = {
      due_date: selectedTime,
      recurrence_mode: this.recurrence_mode,
      set_recurrence: this.set_recurrence
    };
    this.taskService.scheduleData.next(data);
    this.dialogRef.close();
  }

  /**
   * Toggle Repeat Setting
   */
  toggleRepeatSetting(): void {
    this.set_recurrence = !this.set_recurrence;
  }

  filterBusinessDays = (d: Date) => {
    const day = d.getDay();
    return this.enabledDays.includes(day);
  };
}
