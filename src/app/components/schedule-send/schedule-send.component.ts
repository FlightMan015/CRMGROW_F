import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import * as moment from 'moment';
import { ScheduleSelectComponent } from '../schedule-select/schedule-select.component';
import { TaskService } from '../../services/task.service';
import { HOURS, WIN_TIMEZONE } from 'src/app/constants/variable.constants';
import { UserService } from 'src/app/services/user.service';

const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wedensday',
  'Thursday',
  'Friday',
  'Saturday'
];
@Component({
  selector: 'app-schedule-send',
  templateUrl: './schedule-send.component.html',
  styleUrls: ['./schedule-send.component.scss']
})
export class ScheduleSendComponent implements OnInit {
  schedule_list: any[];
  timezone = '';
  timezones = WIN_TIMEZONE;

  businessHour = null;

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ScheduleSendComponent>,
    private userService: UserService,
    private taskService: TaskService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    const tz = moment.tz.guess();
    let timezones = [];
    WIN_TIMEZONE.forEach((e) => {
      timezones = [...timezones, ...e.timezones];
    });
    const tzDoc = timezones.find((e) => e.tz_name === tz);
    this.timezone = tzDoc?.name || tz;
  }

  ngOnInit(): void {
    const garbage = this.userService.garbage.getValue();
    this.businessHour =
      this.data.type === 'email' ? garbage.email_time : garbage.text_time;
    if (this.businessHour?.is_enabled) {
      const startTime = this.businessHour.start_time;
      const endTime = this.businessHour.end_time;
      const startIndex = HOURS.findIndex((e) => e.id === startTime);
      const endIndex = HOURS.findIndex((e) => e.id === endTime);
      const middleIndex = Math.ceil((endIndex - startIndex) / 2) + startIndex;
      const nextDayTime = moment()
        .add(1, 'day')
        .set('hour', startIndex)
        .toDate();
      const nextDayTime2 = moment()
        .add(1, 'day')
        .set('hour', middleIndex)
        .toDate();
      const nextWeekTime = moment()
        .add(1, 'week')
        .startOf('isoWeek')
        .set('hour', startIndex)
        .toDate();
      this.schedule_list = [
        {
          schedule_text: 'Tomorrow business start time',
          schedule_date: nextDayTime
        },
        {
          schedule_text: 'Tomorrow business time',
          schedule_date: nextDayTime2
        },
        {
          schedule_text: 'Next Monday business start time',
          schedule_date: nextWeekTime
        }
      ];
    } else {
      const nextDayTime = moment().add(1, 'day').set('hour', 8).toDate();
      const nextDayTime2 = moment().add(1, 'day').set('hour', 13).toDate();
      const nextWeekTime = moment()
        .add(1, 'week')
        .startOf('isoWeek')
        .set('hour', 8)
        .toDate();
      this.schedule_list = [
        { schedule_text: 'Tomorrow morning', schedule_date: nextDayTime },
        {
          schedule_text: 'Tomorrow afternoon',
          schedule_date: nextDayTime2
        },
        {
          schedule_text: 'Next Monday morning',
          schedule_date: nextWeekTime
        }
      ];
    }
  }
  sendSchedule(date: Date): void {
    const data = {
      due_date: date,
      recurrence_mode: '',
      set_recurrence: false
    };
    this.taskService.scheduleData.next(data);
    this.dialogRef.close();
  }

  selectschedule(): void {
    this.dialogRef.close();
    const materialDialog = this.dialog.open(ScheduleSelectComponent, {
      width: '50vw',
      maxWidth: '600px',
      data: {
        businessHour: this.businessHour
      }
    });
    materialDialog['_overlayRef']['_host'].classList.add('top-dialog');
    materialDialog.afterClosed().subscribe((res) => {
      if (res) {
        this.dialogRef.close();
      }
    });
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
// let morningTime = '08:00:00.000';
// const timezone = this.businessHour.timezone || moment.tz.guess();
// const enabledDays = this.businessHour.enabled_days || [];
// const startTime = this.businessHour.start_time;
// const endTime = this.businessHour.end_time;
// const startIndex = HOURS.findIndex((e) => e.id === startTime);
// const endIndex = HOURS.findIndex((e) => e.id === endTime);
// const middleIndex = Math.ceil((endIndex - startIndex) / 2) + startIndex;
// morningTime = HOURS[startIndex].id;
// enabledDays.sort((a, b) => a - b);
// if (enabledDays[0] === 0) {
//   enabledDays.shift();
//   enabledDays.push(0);
// }
// const weekStart = moment().startOf('week');
// const weekTimes = [];
// enabledDays.forEach((e) => {
//   const dayIndex = e !== 0 ? e : 7;
//   const day = weekStart
//     .clone()
//     .add(dayIndex, 'days')
//     .format('YYYY-MM-DD');
//   const time = moment.tz(day + 'T' + morningTime, timezone);
//   weekTimes.push(time);
// });
// enabledDays.forEach((e) => {
//   const dayIndex = e !== 0 ? e : 7;
//   const day = weekStart
//     .clone()
//     .add(dayIndex + 7, 'days')
//     .format('YYYY-MM-DD');
//   const time = moment.tz(day + 'T' + morningTime, timezone);
//   weekTimes.push(time);
// });
// let nextDayTime;
// const now = new Date();
// weekTimes.some((e) => {
//   console.log('e.unitx', e, e.unix(), now.getTime());
//   if (e.unix() * 1000 > now.getTime()) {
//     nextDayTime = e;
//     return true;
//   }
// });
// const nextDayTime2 = nextDayTime
//   .clone()
//   .add(middleIndex - startIndex, 'hour');
// const nextWeekStr = nextDayTime
//   .clone()
//   .add(1, 'week')
//   .startOf('week')
//   .add(enabledDays[0], 'day')
//   .format('YYYY-MM-DD');
// const nextWeekTime = moment.tz(nextWeekStr + 'T' + morningTime, timezone);
// this.schedule_list = [
//   {
//     schedule_text: 'Next bussiness day time (1)',
//     schedule_date: nextDayTime.toDate()
//   },
//   {
//     schedule_text: 'Next business day time (2)',
//     schedule_date: nextDayTime2.toDate()
//   },
//   {
//     schedule_text: 'Next week first business day time',
//     schedule_date: nextWeekTime.toDate()
//   }
// ];
