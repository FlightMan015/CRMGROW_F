import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import * as moment from 'moment';
import { UserService } from 'src/app/services/user.service';
import { HOURS } from 'src/app/constants/variable.constants';

@Component({
  selector: 'app-business-hour',
  templateUrl: './business-hour.component.html',
  styleUrls: ['./business-hour.component.scss']
})
export class BusinessHourComponent implements OnInit, OnDestroy {
  // Constant Variables
  WEEK_DAYS = [
    { id: 0, label: 'Sun' },
    { id: 1, label: 'Mon' },
    { id: 2, label: 'Tue' },
    { id: 3, label: 'Wed' },
    { id: 4, label: 'Thu' },
    { id: 5, label: 'Fri' },
    { id: 6, label: 'Sat' }
  ];
  times = HOURS;
  // Email Business Hour
  isEmailBusiness = false;
  emailStartTime = HOURS[0].id;
  emailEndTime = HOURS[23].id;
  emailWeekDays = [];
  emailTimezone = moment.tz.guess();

  // Text Business Hour
  useAnotherSetting = false;
  isTextBusiness = false;
  textStartTime = HOURS[0].id;
  textEndTime = HOURS[23].id;
  textWeekDays = [];
  textTimezone = moment.tz.guess();

  // Form Variables
  saving = false;
  saveSubscription: Subscription;
  garbageSubscription: Subscription;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.garbageSubscription = this.userService.garbage$.subscribe(
      (_garbage) => {
        if (_garbage.email_time) {
          this.isEmailBusiness = _garbage.email_time.is_enabled;
          if (this.isEmailBusiness) {
            this.emailStartTime = _garbage.email_time.start_time;
            this.emailEndTime = _garbage.email_time.end_time;
            this.emailWeekDays = _garbage.email_time.enabled_days;
          }
        }
        if (_garbage.text_time) {
          this.isTextBusiness = _garbage.text_time.is_enabled;
          if (this.isTextBusiness) {
            this.textStartTime = _garbage.text_time.start_time;
            this.textEndTime = _garbage.text_time.end_time;
            this.textWeekDays = _garbage.text_time.enabled_days;
          }
        }
        if (
          JSON.stringify(_garbage.email_time) ===
          JSON.stringify(_garbage.text_time)
        ) {
          this.useAnotherSetting = false;
        } else {
          this.useAnotherSetting = true;
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.garbageSubscription && this.garbageSubscription.unsubscribe();
    this.saveSubscription && this.saveSubscription.unsubscribe();
  }

  selectEmailTimezone($event): void {
    try {
      this.emailTimezone = $event?.tz_name;
    } catch (err) {
      this.emailTimezone = moment.tz.guess();
    }
  }

  selectTextTimezone($event): void {
    try {
      this.textTimezone = $event?.tz_name;
    } catch (err) {
      this.textTimezone = moment.tz.guess();
    }
  }

  /**
   * Toggle the business day in week
   * @param day
   */
  toggleEmailWeekDay(day): void {
    const pos = this.emailWeekDays.indexOf(day.id);
    if (pos !== -1) {
      this.emailWeekDays.splice(pos, 1);
    } else {
      this.emailWeekDays.push(day.id);
    }
  }

  /**
   * Toggle the business day in week
   * @param day
   */
  toggleTextWeekDay(day): void {
    const pos = this.textWeekDays.indexOf(day.id);
    if (pos !== -1) {
      this.textWeekDays.splice(pos, 1);
    } else {
      this.textWeekDays.push(day.id);
    }
  }

  /**
   * Save the setting
   */
  saveSetting(): void {
    const data = {};
    if (this.isEmailBusiness) {
      data['email_time'] = {
        is_enabled: true,
        start_time: this.emailStartTime,
        end_time: this.emailEndTime,
        enabled_days: this.emailWeekDays,
        timezone: this.emailTimezone
      };
    } else {
      data['email_time'] = {
        is_enabled: false
      };
    }
    if (!this.useAnotherSetting) {
      data['text_time'] = { ...data['email_time'] };
    } else {
      if (this.isTextBusiness) {
        data['text_time'] = {
          is_enabled: true,
          start_time: this.textStartTime,
          end_time: this.textEndTime,
          enabled_days: this.textWeekDays,
          timezone: this.textTimezone
        };
      } else {
        data['text_time'] = {
          is_enabled: false
        };
      }
    }
    this.saving = true;
    this.saveSubscription = this.userService
      .updateGarbage(data)
      .subscribe((res) => {
        this.saving = false;
        this.userService.updateGarbageImpl(data);
      });
  }
}
