import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { numPad } from 'src/app/helper';

import { CalendarView, CalendarMonthViewDay } from 'angular-calendar';
import * as moment from 'moment';
import * as moment_tz from 'moment-timezone';
import { EventType } from '../../models/eventType.model';
import { ScheduleService } from '../../services/schedule.service';
import { STATUS, WIN_TIMEZONE } from 'src/app/constants/variable.constants';
import { Subject } from 'rxjs';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-input-scheduler',
  templateUrl: './input-scheduler.component.html',
  styleUrls: ['./input-scheduler.component.scss']
})
export class InputSchedulerComponent implements OnInit {
  @Input() id;
  @Input() showTimezone = true;
  @Output() valueChange = new EventEmitter();

  eventType: EventType;
  view: CalendarView = CalendarView.Month;
  viewDate = moment();

  selectedTime = '';
  selectedDay = '';

  time_zone_info: any;
  user_timezone: any;
  defaultTimeZone = true;
  timezones = WIN_TIMEZONE;

  weeklyHours = {
    sun: {
      available: false,
      hours: []
    },
    mon: {
      available: false,
      hours: []
    },
    tue: {
      available: false,
      hours: []
    },
    wed: {
      available: false,
      hours: []
    },
    thu: {
      available: false,
      hours: []
    },
    fri: {
      available: false,
      hours: []
    },
    sat: {
      available: false,
      hours: []
    }
  };
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  refresh: Subject<any> = new Subject();

  maxDate: any;
  minDate: any;
  prevBtn = false;
  nextBtn = false;
  isValidTimes = true;
  times = [];

  loading = true;
  changingTimezone = false;
  loadedCalendar = false;
  user_id;
  currentTimezone = moment_tz.tz.guess();

  constructor(
    public scheduleService: ScheduleService,
    private userService: UserService
  ) {
    this.scheduleService.getEventTypes(true);
  }

  ngOnInit(): void {
    this.userService.profile.subscribe((user) => {
      this.user_id = user._id;
      this.timezones.some((ele) => {
        return ele.timezones.some((timezone) => {
          if (timezone.tz_name === this.currentTimezone) {
            this.defaultTimeZone = ele.country !== 'OTHER';
            this.time_zone_info = JSON.stringify(timezone);
            return true;
          }

          if (timezone.utc && timezone.utc.includes(this.currentTimezone)) {
            this.defaultTimeZone = ele.country !== 'OTHER';
            this.time_zone_info = JSON.stringify(timezone);
            return true;
          }
        });
      });
      this.user_timezone = JSON.parse(user['time_zone_info']).tz_name;
      // moment.tz.setDefault(this.user_timezone);
    });

    if (this.id) {
      this.scheduleService.eventTypes$.subscribe((eventTypes) => {
        eventTypes.some((res) => {
          if (res._id === this.id) {
            this.scheduleService.eventType.next(res);
            this.eventType = res;
            this.setDateRange(this.eventType);
            this.scheduleService.loadCalendar(
              moment(this.viewDate).startOf('month').format(),
              this.eventType,
              this.user_id
            );
            return true;
          }
        });
      });

      this.scheduleService.loadCalendarStatus$.subscribe((res) => {
        if (res == STATUS.SUCCESS) {
          if (!this.loadedCalendar) {
            this.loadedCalendar = true;
          }
          this.loading = false;
          this.changingTimezone = false;
          this.refresh.next();
        }
      });
    }
  }

  changeTiemzone(): void {
    const selectedTimezone = JSON.parse(this.time_zone_info).tz_name;

    moment.tz.setDefault(selectedTimezone);

    const workingHours = JSON.parse(JSON.stringify(this.weeklyHours));
    const startOfWeek = moment_tz
      .tz(moment(), this.user_timezone)
      .startOf('week');
    const endOfWeek = moment_tz.tz(moment(), this.user_timezone).endOf('week');
    const _current = startOfWeek.clone();

    while (endOfWeek.isAfter(_current)) {
      const _weekday = _current.format('ddd').toLowerCase();
      const { hours, available } = this.eventType.weekly_hours[_weekday];
      if (available && Array.isArray(hours)) {
        for (const hour of hours) {
          const { start, end } = hour;
          const startDate = moment_tz
            .tz(_current.format('YYYY-MM-DD ' + start), this.user_timezone)
            .tz(selectedTimezone);
          const endDate = moment_tz
            .tz(_current.format('YYYY-MM-DD ' + end), this.user_timezone)
            .tz(selectedTimezone);

          const weekday1 = startDate.format('ddd').toLowerCase();
          const weekday2 = endDate.format('ddd').toLowerCase();
          if (weekday1 !== weekday2) {
            workingHours[weekday1]['available'] = true;
            workingHours[weekday2]['available'] = true;

            workingHours[weekday1]['hours'].push({
              start: startDate.format('HH:mm'),
              end: '23:45'
            });
            workingHours[weekday2]['hours'].push({
              start: '00:00',
              end: endDate.format('HH:mm')
            });
          } else {
            workingHours[weekday1]['available'] = true;
            workingHours[weekday1]['hours'].push({
              start: startDate.format('HH:mm'),
              end: endDate.format('HH:mm')
            });
          }
        }
      }

      _current.add(1, 'day');
    }

    this.eventType.weekly_hours = workingHours;
    this.user_timezone = selectedTimezone;
    this.setDateRange(this.eventType);
    this.viewDate = moment();
    this.selectedTime = '';
    this.scheduleService.calendarEvents.next({});
    this.loading = true;
    this.changingTimezone = true;
    this.scheduleService.loadCalendar(
      this.viewDate,
      this.eventType,
      this.user_id
    );
    this.refresh.next();
  }

  dateIsValid(date, inMonth = true): boolean {
    let isValidRange = moment(date).endOf('day').isSameOrAfter(this.minDate);
    if (this.maxDate !== undefined) {
      isValidRange =
        moment(date).endOf('day').isSameOrAfter(this.minDate) &&
        moment(date).isSameOrBefore(this.maxDate);
    }

    const { weekly_hours } = this.eventType;

    const weekday = moment(date).format('ddd').toLowerCase();
    const isValidWeekly = weekly_hours[weekday].available;

    if (inMonth && isValidRange && isValidWeekly) {
      const times = this.getTimes(moment(date).format('YYYY-MM-DD'));
      return times.length ? true : false;
    }
    return false;
  }

  beforeViewRender({ body }: { body: CalendarMonthViewDay[] }): void {
    if (!this.loadedCalendar || this.loading) {
      body.forEach((day) => {
        day.cssClass = 'disabled-date';
      });
    } else {
      body.forEach((day) => {
        if (!this.dateIsValid(day.date, day.inMonth)) {
          day.cssClass = 'disabled-date';
        } else {
          day.cssClass = 'enable-date';
        }
        if (this.selectedDay == moment(day.date).format('YYYY-MM-DD')) {
          this.isValidTimes = this.getTimes(this.selectedDay).length > 0;
        }
      });
    }
  }

  isSelectedDay(date) {
    return this.selectedDay == moment(date).format('YYYY-MM-DD');
  }

  timeClicked(time: string): void {
    this.selectedTime = time;
    const selectedTimezone = JSON.parse(this.time_zone_info).tz_name;

    const selectedDatetime = moment_tz
      .tz(this.selectedDay + ' ' + this.selectedTime, selectedTimezone)
      .format();

    this.valueChange.emit({
      datetime: selectedDatetime,
      timezone: selectedTimezone
    });
  }

  dayClicked(dayObj: any): void {
    this.selectedDay = moment(dayObj.date).format('YYYY-MM-DD');
    this.isValidTimes = true;
    this.selectedTime = '';
  }

  monthButtonnClicked(type) {
    if (type === 'prev') {
      this.viewDate = moment(this.viewDate).subtract(1, 'month');
    } else {
      this.viewDate = moment(this.viewDate).add(1, 'month');
    }
    const calendarEvents = this.scheduleService.calendarEvents.getValue();
    const index = moment(this.viewDate).startOf('month').format('YYYY-MM-DD');

    if (calendarEvents[index]) {
      this.loading = false;
    } else {
      this.loading = true;
    }
    this.scheduleService.loadCalendar(
      this.viewDate,
      this.eventType,
      this.user_id
    );
    this.refresh.next();
  }

  getTimes(selectedDay): Array<any> {
    moment.tz.setDefault(JSON.parse(this.time_zone_info).tz_name);
    const calendarEvents = this.scheduleService.calendarEvents.getValue();
    const index = moment(this.viewDate).startOf('month').format('YYYY-MM-DD');
    const schedules = calendarEvents[index] ? calendarEvents[index] : [];
    const weekday = moment(selectedDay).format('ddd').toLowerCase();
    const { weekly_hours, duration, gap } = this.eventType;
    const before = gap.start.available ? gap.start.value : null;
    const after = gap.end.available ? gap.end.value : null;
    const { hours } = weekly_hours[weekday];

    const meetings = [];
    for (const { start, end } of hours) {
      const startDate = moment(selectedDay + ' ' + start);
      const endDate = moment(selectedDay + ' ' + end);
      // const startDate = moment_tz.tz(
      //   selectedDay + ' ' + start,
      //   this.user_timezone
      // );
      // const endDate = moment_tz.tz(selectedDay + ' ' + end, this.user_timezone);

      while (startDate.isSameOrBefore(endDate)) {
        meetings.push(startDate.clone());
        startDate.add(duration, 'minutes');
      }
    }

    const _schedules = [];
    schedules.forEach((e) => {
      let _start = moment(e.due_start);
      let _end = moment(e.due_end);
      if (moment(e.due_start, 'YYYY-MM-DD', true).isValid()) {
        _start = moment(e.due_start, 'YYYY-MM-DD').startOf('day');
      }
      if (moment(e.due_end, 'YYYY-MM-DD', true).isValid()) {
        _end = moment(e.due_end, 'YYYY-MM-DD').endOf('day');
      }

      if (
        _start.isBetween(
          moment(selectedDay, 'YYYY-MM-DD').startOf('day'),
          moment(selectedDay, 'YYYY-MM-DD').endOf('day')
        )
      ) {
        const due_start = before
          ? _start.clone().subtract(before + duration, 'minutes')
          : _start.clone().subtract(duration, 'minutes');
        const due_end = after
          ? _end.clone().add(after, 'minutes')
          : _end.clone();
        _schedules.push({ due_start, due_end });
      }
    });

    const ranges = [];
    meetings.forEach((hour) => {
      let valid = moment(hour).isSameOrAfter(this.minDate);
      for (const schedule of _schedules) {
        if (
          moment(hour).isAfter(schedule.due_start) &&
          moment(hour).isBefore(schedule.due_end)
        ) {
          valid = false;
          break;
        }
      }
      if (valid) {
        ranges.push(hour.format('HH:mm'));
      }
    });

    return ranges.sort((a, b) => a.localeCompare(b));
  }

  diplayCurrentMonth(): string {
    return moment(this.viewDate).format('MMMM YYYY');
  }

  setDateRange(eventType): void {
    // const today = moment_tz.tz(moment(), this.user_timezone).startOf('day');
    const today = moment().startOf('day');
    const updated_at = moment_tz
      .tz(eventType.updated_at, this.user_timezone)
      .startOf('day');

    const { date_range } = eventType;
    this.minDate = today.isAfter(updated_at)
      ? today.clone()
      : updated_at.clone();
    switch (date_range.type) {
      case 'days':
        const { type, value } = date_range.data.days;
        if (type == 'business') {
          this.maxDate = this.addBusinessDays(updated_at, value);
        } else {
          this.maxDate = updated_at.add(value - 1, 'days');
        }
        break;
      case 'range':
        const { start, end } = date_range.data.range;
        const from = `${start.year}-${start.month}-${start.day}`;
        const to = `${end.year}-${end.month}-${end.day}`;
        this.maxDate = moment(to);
        this.minDate = today.isAfter(moment(from))
          ? today.clone()
          : moment(from);
        break;
      default:
        this.maxDate = undefined;
        break;
    }
  }

  addBusinessDays(originalDate, numDaysToAdd) {
    const Sunday = 0;
    const Saturday = 6;
    let daysRemaining = numDaysToAdd;

    const newDate = originalDate.clone();

    while (daysRemaining > 0) {
      if (newDate.day() !== Sunday && newDate.day() !== Saturday) {
        daysRemaining--;
      }
      if (daysRemaining > 0) {
        newDate.add(1, 'days');
      }
    }
    return newDate;
  }

  disableButton(viewDate, type) {
    const monthStart = moment(viewDate).clone().startOf('month');
    const monthEnd = moment(viewDate).clone().endOf('month');
    if (!this.loadedCalendar) {
      return true;
    }

    if (type === 'prev') {
      return monthStart.diff(this.minDate, 'days') <= 0;
    }

    if (type === 'next') {
      return this.maxDate == undefined
        ? false
        : monthEnd.diff(this.maxDate, 'days') >= 0;
    }
    return true;
  }

  setOptionValue(timezone) {
    return JSON.stringify(timezone);
  }
}
