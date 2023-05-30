import * as _ from 'lodash';
import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  HostListener
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { UserService } from 'src/app/services/user.service';
import { ScheduleService } from '../../services/schedule.service';
import { ToastrService } from 'ngx-toastr';
import { TIMES } from '../../constants/variable.constants';
import { ScheduleLocationEditComponent } from '../../components/schedule-location-edit/schedule-location-edit.component';
import { EventType } from '../../models/eventType.model';
import { environment } from 'src/environments/environment';
import { PageCanDeactivate } from 'src/app/variables/abstractors';
import { PHONE_COUNTRIES } from 'src/app/constants/variable.constants';
import { CountryISO } from 'ngx-intl-tel-input';
import { adjustPhoneNumber } from 'src/app/helper';
import { PhoneInputComponent } from 'src/app/components/phone-input/phone-input.component';
import * as moment from 'moment';
import { AutomationService } from '../../services/automation.service';
import { Automation } from 'src/app/models/automation.model';

@Component({
  selector: 'app-schedule-type-create',
  templateUrl: './schedule-type-create.component.html',
  styleUrls: ['./schedule-type-create.component.scss']
})
export class ScheduleTypeCreateComponent
  extends PageCanDeactivate
  implements OnInit, OnDestroy {
  TIMES = TIMES;
  saved = false;

  DaysTypes = [
    {
      name: 'calendar days',
      value: 'calendar'
    },
    {
      name: 'business days',
      value: 'business'
    }
  ];
  Durations = [
    {
      name: '15 mins',
      value: 15
    },
    {
      name: '30 mins',
      value: 30
    },
    {
      name: '45 mins',
      value: 45
    },
    {
      name: '60 mins',
      value: 60
    }
  ];
  WeekDaysObj = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday'
  };

  WeekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  profileSubscription: Subscription;

  isNew = true;
  schedule_type_id = '';
  loadingEventType = false;
  saveSubscription: Subscription;
  saving = false;

  stepIndex = 1;
  existingLink = false;
  savedLink = '';

  linkRouteURL = '';
  linkCustomized = false;

  eventType: EventType = new EventType();
  dateRange: any = {
    type: 'days',
    data: {
      days: {
        type: 'business',
        value: 60
      },
      range: {
        start: {
          year: moment().year(),
          month: moment().month() + 1,
          day: moment().day()
        },
        end: {
          year: moment().year(),
          month: moment().month() + 1,
          day: moment().day() + 1
        }
      }
    }
  };
  DefaultWorkingHours: any = {
    start: '09:00:00.000',
    end: '17:00:00.000'
  };
  weeklyHours: any = {
    sun: {
      available: false,
      hours: []
    },
    mon: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    tue: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    wed: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    thu: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    fri: {
      available: true,
      hours: [_.clone(this.DefaultWorkingHours)]
    },
    sat: {
      available: false,
      hours: []
    }
  };
  gap: any = {
    start: {
      available: false,
      value: 15
    },
    end: {
      available: false,
      value: 15
    }
  };

  Locations = [
    {
      name: 'In-person meeting',
      value: 'in_person'
    },
    {
      name: 'Phone Call (inbound)',
      value: 'phone'
    },
    {
      name: 'Phone Call (outbound)',
      value: 'phone_out'
    },
    {
      name: 'Webinar',
      value: 'webinar'
    }
  ];

  locationType: string = 'in_person';
  meetingAddress: string = '';
  meetingPhone = '';
  meetingEmail: string = '';

  countries: CountryISO[] = PHONE_COUNTRIES;
  CountryISO = CountryISO;

  oldEventType = new EventType().deserialize({
    weekly_hours: this.weeklyHours,
    location: {
      type: this.locationType,
      additional: ''
    },
    gap: this.gap,
    date_range: this.dateRange,
    duration: this.Durations[0].value
  });

  customDuration = false;
  selectedAutomation: Automation;

  requiredAutomation = false;
  autoTriggers = [
    { value: '1', name: 'After event is booked' },
    { value: '2', name: 'Before event starts' },
    { value: '3', name: 'After event starts' },
    { value: '4', name: 'After event ends' }
  ];
  selectedAutoTrigger = this.autoTriggers[0];
  autoTriggerTimes = [
    { value: 'days', name: 'Days' },
    { value: 'hours', name: 'Hours' },
    { value: 'minutes', name: 'Minutes' }
  ];
  selectedTriggerTime = 'immediate';

  @ViewChild('phone') phoneControl: PhoneInputComponent;
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (!this.saved && !this.isSame()) {
      $event.returnValue = true;
    }
  }

  constructor(
    private userService: UserService,
    public scheduleService: ScheduleService,
    private dialog: MatDialog,
    private toast: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private automationService: AutomationService
  ) {
    super();
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.linkRouteURL = `https://${environment.domain.scheduler}/${profile.nick_name}/`;

        if (profile.scheduler_info && !profile.scheduler_info.is_enabled) {
          this.router.navigate(['/home']);
        }
      }
    );
  }

  ngOnInit(): void {
    this.schedule_type_id = this.route.snapshot.params.id;
    if (this.schedule_type_id === 'create-one') {
      this.eventType.type = 1;
      this.eventType.duration = this.Durations[0].value;
      this.oldEventType.type = 1;
    }
    if (this.schedule_type_id === 'create-group') {
      this.eventType.type = 2;
      this.eventType.duration = this.Durations[0].value;
      this.oldEventType.type = 2;
    }
    if (
      this.schedule_type_id !== 'create-one' &&
      this.schedule_type_id !== 'create-group'
    ) {
      // load schedule type
      this.loadScheduleType();
    }
    this.customDuration = ![15, 30, 45, 60].includes(
      parseInt(this.eventType.duration + '')
    );
  }

  ngOnDestroy(): void {}

  loadScheduleType(): void {
    this.automationService.loadOwn();
    this.loadingEventType = true;
    this.scheduleService
      .getEventType(this.schedule_type_id)
      .subscribe((res) => {
        this.loadingEventType = false;
        if (res) {
          const { link, gap, weekly_hours, date_range } = res;
          this.eventType = JSON.parse(JSON.stringify(res));
          this.oldEventType = JSON.parse(JSON.stringify(res));

          this.locationType = res.location['type'];
          if (res.location['type'] === 'in_person') {
            this.meetingAddress = res.location['additional'];
          } else if (res.location['type'] === 'phone') {
            this.meetingPhone = res.location['additional'];
          } else if (res.location['type'] === 'webinar') {
            this.meetingEmail = res.location['additional'];
          }
          this.savedLink = link.substring(link.lastIndexOf('/') + 1);
          this.weeklyHours = weekly_hours;
          this.gap = gap;
          this.dateRange.type = date_range.type;
          this.dateRange.data = { ...this.dateRange.data, ...date_range.data };
          this.eventType.link = this.savedLink;
          this.oldEventType.link = this.savedLink;
          this.isNew = false;

          if (res.auto_trigger_type) {
            this.requiredAutomation = true;

            this.autoTriggers.some((e) => {
              if (e.value == res.auto_trigger_type) {
                this.selectedAutoTrigger = e;
                this.selectedTriggerTime =
                  res.auto_trigger_duration == 0 ? 'immediate' : 'custom';
                return true;
              }
            });
            this.automationService.automations$.subscribe((ele) => {
              ele.some((e) => {
                if (e._id == res.automation) {
                  this.selectedAutomation = e;
                }
              });
            });
          }
        }
      });
  }

  /**
   * Go to back page
   */
  goToBack(): void {
    if (this.isSame()) {
      this.saved = true;
    }
    this.router.navigate(['/scheduler']);
  }

  goToStep(step: number): void {
    if (this.stepIndex == 1 && step == 2) {
      if (this.checkPhoneRequired() || this.checkPhoneInvalid()) {
        return;
      }
      this.eventType['location'] = {
        type: this.locationType,
        additional:
          this.locationType == 'in_person'
            ? this.meetingAddress
            : this.locationType == 'phone'
            ? adjustPhoneNumber(this.meetingPhone['internationalNumber'])
            : this.locationType == 'webinar'
            ? this.meetingEmail
            : null
      };
    }
    if (step == 3) {
      if (!this.eventType.title) {
        this.toast.warning('Please enter the title of event type.');
        return;
      }
      if (!this.eventType.location) {
        this.toast.warning('Please select a location of event type.');
        return;
      }
      if (!this.eventType.link) {
        this.getLinkFromTitle();
      }

      if (this.savedLink != this.eventType.link) {
        this.scheduleService
          .getEventTypeByLink({
            link: this.linkRouteURL + this.eventType.link
          })
          .subscribe((res) => {
            if (res) {
              this.existingLink = true;
              this.goToStep(2);
            } else {
              this.existingLink = false;
            }
          });
      }
    }

    this.stepIndex = step;
  }

  getLinkFromTitle(): void {
    if (this.eventType.title) {
      this.eventType.link = this.eventType.title
        .split(' ')
        .map((word) => word.toLowerCase().replace(/[^a-zA-Z\d ]/g, ''))
        .join('-');
    }
  }

  onTitleChanged(): void {
    if (!this.linkCustomized) {
      this.getLinkFromTitle();
    }
  }

  onLocationFocused(): void {
    this.dialog
      .open(ScheduleLocationEditComponent, {
        maxWidth: '480px',
        width: '96vw',
        disableClose: true,
        data: this.eventType.location
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.eventType.location = res;
        }
      });
  }

  onLinkChanged(): void {
    this.linkCustomized = !!this.eventType.link;
    this.existingLink = false;
  }

  save(): any {
    if (!this.requiredAutomation) {
      this.eventType.auto_trigger_duration = null;
      this.eventType.auto_trigger_time = null;
      this.eventType.auto_trigger_type = null;
      this.eventType.automation = null;
    } else {
      if (!this.eventType.auto_trigger_type || !this.eventType.automation) {
        return;
      }
      if (this.selectedTriggerTime == 'immediate') {
        this.eventType.auto_trigger_duration = 0;
      }
    }
    this.eventType.weekly_hours = this.weeklyHours;
    this.eventType.gap = this.gap;
    this.eventType.date_range = this.dateRange;
    this.eventType.link = this.linkRouteURL + this.eventType.link;

    this.saving = true;
    this.saveSubscription && this.saveSubscription.unsubscribe();
    if (this.isNew) {
      this.saveSubscription = this.scheduleService
        .createEventType(this.eventType)
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.saved = true;
            // this.scheduleService.getEventTypes(true);
            // this.toast.success('Event type is created successfully.');
            this.goToBack();
          }
        });
    } else {
      this.saveSubscription = this.scheduleService
        .updateEventType(this.eventType._id, this.eventType)
        .subscribe((res) => {
          this.saving = false;
          if (res) {
            this.saved = true;
            // this.scheduleService.getEventTypes(true);
            // this.toast.success('Event type is saved successfully.');
            this.goToBack();
          }
        });
    }
  }

  onWeekdayAvailabilityChange(weekday: string): void {
    if (
      this.weeklyHours[weekday].available == true &&
      this.weeklyHours[weekday].hours.length === 0
    ) {
      this.weeklyHours[weekday].hours.push(_.clone(this.DefaultWorkingHours));
    }
  }

  addNewHour(weekday: string): void {
    this.weeklyHours[weekday].available = true;
    this.weeklyHours[weekday].hours.push(_.clone(this.DefaultWorkingHours));
  }

  removeWeeklyHour(weekday: string, index: number): void {
    if (this.weeklyHours[weekday].hours.length > index) {
      this.weeklyHours[weekday].hours.splice(index, 1);
    }

    if (this.weeklyHours[weekday].hours.length === 0) {
      this.weeklyHours[weekday].available = false;
    }
  }

  validateDateRange(): boolean {
    if (this.dateRange.type !== 'range') {
      return true;
    }
    const start = this.dateRange.data.range.start;
    const end = this.dateRange.data.range.end;
    if (this.dateRange.type == 'range' && Boolean(start) && Boolean(end)) {
      const _start = Date.parse(`${start.year}-${start.month}-${start.day}`);
      const _end = Date.parse(`${end.year}-${end.month}-${end.day}`);
      return _start < _end;
    }
    return false;
  }

  handleAddressChange(evt: any): void {
    this.meetingAddress = evt.formatted_address;
  }

  checkPhoneRequired(): boolean {
    if (this.locationType != 'phone') {
      return false;
    }

    if (!this.meetingPhone || !Object.keys(this.meetingPhone)) {
      return true;
    }
    return false;
  }
  checkPhoneInvalid(): boolean {
    if (this.locationType != 'phone') {
      return false;
    }

    if (!this.meetingPhone || !this.phoneControl.valid) {
      return true;
    }

    if (Object.keys(this.meetingPhone).length && this.phoneControl.valid) {
      return false;
    }
    return true;
  }

  isSame() {
    this.eventType['location'] = {
      type: this.locationType,
      additional:
        this.locationType == 'in_person'
          ? this.meetingAddress
          : this.locationType == 'phone'
          ? this.meetingPhone
            ? adjustPhoneNumber(this.meetingPhone['internationalNumber'])
            : null
          : this.locationType == 'webinar'
          ? this.meetingEmail
          : null
    };
    this.eventType.weekly_hours = this.weeklyHours;
    this.eventType.gap = this.gap;
    this.eventType.date_range = this.dateRange;

    return _.isEqual(
      JSON.parse(JSON.stringify(this.eventType)),
      JSON.parse(JSON.stringify(this.oldEventType))
    );
  }

  setCustomeDuration(event) {
    if (!event.checked) {
      this.eventType.duration = 15;
    }
  }

  selectAutomation(evt: Automation) {
    this.selectedAutomation = evt;
    this.eventType.automation = evt && evt._id ? evt._id : null;
  }

  changeAutoTriggerTime(event) {
    // if (event.value == 'immediate') {
    //   this.eventType.auto_trigger_duration = 0;
    // } else {
    //   this.eventType.auto_trigger_duration = 24;
    //   this.eventType.auto_trigger_time = 'hours';
    // }
  }

  changeAutoTriggerType(event) {
    this.autoTriggers.some((e) => {
      if (e.value == event.value) {
        this.selectedAutoTrigger = e;
        this.selectedTriggerTime = e.value == '2' ? 'custom' : 'immediate';
        this.eventType.auto_trigger_duration = 24;
        this.eventType.auto_trigger_time = 'hours';
        return true;
      }
    });
  }
}
