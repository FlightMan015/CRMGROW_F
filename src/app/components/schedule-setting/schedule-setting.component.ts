import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import * as moment from 'moment';
import 'moment-timezone';
import { REPEAT_DURATIONS, TIMES } from 'src/app/constants/variable.constants';
import { numPad } from 'src/app/helper';

@Component({
  selector: 'app-schedule-setting',
  templateUrl: './schedule-setting.component.html',
  styleUrls: ['./schedule-setting.component.scss']
})
export class ScheduleSettingComponent implements OnInit {
  TIMES = TIMES;
  REPEAT_DURATIONS = REPEAT_DURATIONS;

  title = '';
  minDate;
  date;
  time;
  set_recurrence = false;
  recurrence_mode = 'WEEKLY';
  error = null;

  timeChange = false;
  recurrenceChange = false;

  constructor(
    private dialogRef: MatDialogRef<ScheduleSettingComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const current = new Date();
    const timezone = moment.tz.guess();
    this.minDate = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };
    this.date = this.minDate;
    if (this.data.recurrence) {
      this.recurrenceChange = true;
      this.set_recurrence = this.data.recurrence.set_recurrence || false;
      this.recurrence_mode = this.data.recurrence.recurrence_mode || 'WEEKLY';
    }
    if (this.data.time) {
      this.timeChange = true;
      const dateObj = moment.tz(this.data.time, timezone);
      const yearNum = parseInt(dateObj.format('yyyy'));
      const monthNum = parseInt(dateObj.format('M'));
      const dateNum = parseInt(dateObj.format('D'));
      const timeStr = dateObj.format('hh:mm') + ':00.000';
      this.time = timeStr;
      this.date = {
        year: yearNum,
        month: monthNum,
        day: dateNum
      };
    }
    if (this.data.title) {
      this.title = this.data.title;
    }
  }

  ngOnInit(): void {}

  /**
   * Recurrence mode toggle
   */
  toggleRepeatSetting(): void {
    this.set_recurrence = !this.set_recurrence;
  }

  /**
   * Clear error
   */
  clearError(): void {
    this.error = '';
  }

  /**
   * Submit the data
   */
  save(): void {
    const data = {};
    if (this.timeChange) {
      const dateString = `${this.date['year']}-${numPad(
        this.date['month']
      )}-${numPad(this.date['day'])}`;
      const timezone = moment.tz.guess();
      const zone = moment.tz(dateString, timezone).format('Z');
      const due_date = new Date(`${dateString}T${this.time}${zone}`);
      if (due_date.getTime() < Date.now() + 180000) {
        this.error = 'Please select the future time.';
        return;
      }
      data['time'] = due_date;
    }
    if (this.recurrenceChange) {
      data['recurrence'] = {
        set_recurrence: this.set_recurrence,
        recurrence_mode: this.recurrence_mode
      };
    }
    this.dialogRef.close(data);
  }
}
