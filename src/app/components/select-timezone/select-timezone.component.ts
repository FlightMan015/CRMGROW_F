import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WIN_TIMEZONE } from 'src/app/constants/variable.constants';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';
import 'moment-timezone';
@Component({
  selector: 'app-select-timezone',
  templateUrl: './select-timezone.component.html',
  styleUrls: ['./select-timezone.component.scss']
})
export class SelectTimezoneComponent implements OnInit {
  @Input() public uiType = 'selector';
  @Input() public set isDefaultTimezone(val) {
    this.defaultTimeZone = val;
  }
  @Input() public set disabled(val) {
    if (val) {
      this.formControl.disable();
    } else {
      this.formControl.enable();
    }
  }
  @Input() public set selectedTimezone(tz_name) {
    let timezone;
    if (tz_name) {
      timezone = tz_name;
    } else {
      timezone = moment.tz.guess();
    }
    const init = this.setTimezoneInfo(timezone);
    if (!init) {
      this.setTimezoneInfo(moment.tz.guess());
    }
  }

  @Output() onChange = new EventEmitter();

  defaultTimeZone = true;
  timezones = WIN_TIMEZONE;
  timezoneInfo;

  formControl: FormControl = new FormControl();
  constructor() {}

  ngOnInit(): void {}

  changeTimezone(event): void {
    this.onChange.emit(JSON.parse(event.value));
  }

  setOptionValue(timezone) {
    return JSON.stringify(timezone);
  }

  showAllTimezones(timezone) {
    this.defaultTimeZone = !this.defaultTimeZone;
    if (this.defaultTimeZone) {
      let is_show = false;
      WIN_TIMEZONE.some((ele) => {
        if (ele.country != 'OTHER') {
          return ele.timezones.some((timezone_info) => {
            if (JSON.stringify(timezone_info) === JSON.stringify(timezone)) {
              is_show = true;
            }
          });
        }
      });

      if (!is_show) {
        this.onChange.emit(null);
      }
    }
  }

  setTimezoneInfo(timezone) {
    return WIN_TIMEZONE.some((ele) => {
      return ele.timezones.some((timezone_info) => {
        if (timezone_info?.tz_name === timezone) {
          this.defaultTimeZone = ele.country !== 'OTHER';
          this.timezoneInfo = timezone_info;
          this.formControl.setValue(JSON.stringify(timezone_info));
          return true;
        }

        if (timezone_info?.utc && timezone_info.utc.includes(timezone)) {
          this.defaultTimeZone = ele.country !== 'OTHER';
          this.timezoneInfo = timezone_info;
          this.formControl.setValue(JSON.stringify(timezone_info));
          return true;
        }
      });
    });
  }

  selectTimezone(timezone) {
    this.timezoneInfo = timezone;
    this.onChange.emit(timezone);
  }
  displayTimezone() {
    if (this.timezoneInfo?.tz_name) {
      const parts = this.timezoneInfo.name.split('(');
      const offset = moment.tz(moment(), this.timezoneInfo.tz_name).format('Z');
      return `Time zone - ${parts[0]} (UTC${offset})`;
    } else {
      return '';
    }
  }
}
