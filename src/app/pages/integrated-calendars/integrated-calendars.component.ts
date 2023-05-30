import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { UserService } from '../../services/user.service';
import { STATUS } from '../../constants/variable.constants';
import { AppointmentService } from 'src/app/services/appointment.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-integrated-calendars',
  templateUrl: './integrated-calendars.component.html',
  styleUrls: ['./integrated-calendars.component.scss']
})
export class IntegratedCalendarsComponent implements OnInit, OnDestroy {
  STATUS = STATUS;
  public user: any = {};

  calendars = {};

  calendarLoadSubscription: Subscription;
  profileSubscription: Subscription;

  calendarToAdd: any;
  calendarList = [];

  updating = false;

  constructor(
    public userService: UserService,
    private toast: ToastrService,
    public appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.appointmentService.loadCalendars(true);
    this.initSubscriptions();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
  }

  initSubscriptions(): void {
    // Load Calendars
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    this.calendarLoadSubscription = this.appointmentService.calendars$.subscribe(
      (data) => {
        this.calendars = {};
        const allCalendars = [];
        if (data) {
          data.forEach((account, index) => {
            if (account.data) {
              const calendarList = [];
              account.data.forEach((e, key) => {
                allCalendars.push(e.id);
                calendarList.push({ ...e, email: account.email });
              });
              this.calendars[account.email] = calendarList;
            }
          });
        }
        // Profile Load Subscription
        this.profileSubscription && this.profileSubscription.unsubscribe();
        this.profileSubscription = this.userService.profile$.subscribe(
          (profile) => {
            this.user = profile;
            this.calendarToAdd = profile.scheduler_info?.calendar_id;
            this.calendarList = profile.calendar_list;

            if (
              !this.calendarToAdd ||
              !allCalendars.includes(this.calendarToAdd)
            ) {
              this.calendarToAdd = allCalendars.length ? allCalendars[0] : '';
            }
          }
        );
      }
    );
  }

  changeCalendarToAdd(calendar): void {
    const profile = this.userService.profile.getValue();
    if (profile) {
      this.calendarToAdd = calendar.id;

      const scheduler_info = {
        ...profile.scheduler_info,
        connected_email: calendar.email,
        calendar_id: calendar.id
      };
      this.updating = true;
      this.userService.updateProfile({ scheduler_info }).subscribe((res) => {
        if (res) {
          this.updating = false;
          this.userService.setProfile(res);
          // this.toast.success(
          //   'Calendar to add new events is updated successfully.'
          // );
        }
      });
    }
  }

  changeCalendarsForConflicts(event, index, item) {
    const checked = event.target.checked;
    this.calendarList[index] = { ...item, check_conflict_scheduler: checked };

    this.updating = true;
    this.userService
      .updateProfile({ calendar_list: this.calendarList })
      .subscribe((res) => {
        if (res) {
          this.updating = false;
          this.userService.setProfile(res);
          // this.toast.success(
          //   'Calendar(s) to check conflicts is updated successfully.'
          // );
        }
      });
  }
}
