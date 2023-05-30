import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { DialogSettings, TIMES } from 'src/app/constants/variable.constants';
import { getCurrentTimezone, numPad } from 'src/app/helper';
import { AppointmentService } from 'src/app/services/appointment.service';
import { TeamService } from 'src/app/services/team.service';
import { UserService } from 'src/app/services/user.service';
import * as moment from 'moment';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from '../confirm/confirm.component';
import { CalendarDialogComponent } from '../calendar-dialog/calendar-dialog.component';
import { CallRequestCancelComponent } from '../call-request-cancel/call-request-cancel.component';
import { TeamMemberProfileComponent } from '../team-member-profile/team-member-profile.component';

@Component({
  selector: 'app-call-overlay',
  templateUrl: './call-overlay.component.html',
  styleUrls: ['./call-overlay.component.scss']
})
export class CallOverlayComponent implements OnInit {
  @Input('call') call: any;
  TIMES = TIMES;
  MIN_DATE = {};

  userId;
  userTimezone;
  isOrganizer = false;
  selectedTime;
  customDate;
  customTime = TIMES[0]['id'];
  calendaryLink;
  note = '';
  accepting = false;
  declining = false;
  completing = false;

  customDateTimes = [];

  profileSubscription: Subscription;

  constructor(
    private profileService: UserService,
    private teamService: TeamService,
    private appointmentService: AppointmentService,
    private toast: ToastrService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (this.call.proposed_at.length) {
      this.selectedTime = this.call.proposed_at[0];
    }
    this.note = this.call.note;

    const current = new Date();
    this.MIN_DATE = {
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      day: current.getDate()
    };

    this.customDateTimes.push({
      id: Date.now(),
      date: this.MIN_DATE,
      time: '15:00:00.000'
    });

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.profileService.profile$.subscribe(
      (profile) => {
        if (profile && profile._id) {
          this.userId = profile._id;
          try {
            this.userTimezone = JSON.parse(profile.time_zone_info);
          } catch (err) {
            const timezone = getCurrentTimezone();
            this.userTimezone = { zone: profile.time_zone || timezone };
          }
          this.checkOrganizer();
        }
      }
    );
  }

  checkOrganizer(): void {
    if (this.call && this.call.user) {
      this.isOrganizer = this.call.user._id === this.userId;
    }
  }

  selectTime(time): void {
    this.selectedTime = time;
  }

  isSelectedTime(time): boolean {
    return this.selectedTime === time;
  }

  calendarLink(): void {
    const res = this.profileService.profile.getValue();
    if (
      res['garbage'] &&
      res['garbage'].calendly &&
      res['garbage'].calendly.link
    ) {
      this.calendaryLink = res['garbage'].calendly.link;
    } else {
      this.toast.info('', 'Please connect with calendly.', {
        closeButton: true
      });
    }
  }

  goToCalendly(): void {
    window.open(this.calendaryLink);
  }

  delete(): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete group call',
          message: 'Are you sure to remove this group call?',
          label: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((status) => {
        if (status) {
          this.teamService.deleteCall(this.call._id).subscribe((status) => {
            if (status) {
              // this.dialogRef.close({ action: 'delete', id: this.call._id });
            }
          });
        }
      });
  }

  complete(): void {
    this.completing = true;
    this.teamService
      .updateCall(this.call._id, {
        status: 'finished',
        note: this.call.note
      })
      .subscribe((status) => {
        this.completing = false;
        if (status) {
          // this.dialogRef.close({
          //   action: 'update',
          //   data: {
          //     status: 'finished',
          //     note: this.call.note
          //   },
          //   id: this.call._id
          // });
        }
      });
  }

  decline(): void {
    this.declining = true;
    this.teamService
      .updateCall(this.call._id, {
        status: 'declined'
      })
      .subscribe((status) => {
        this.declining = false;
        if (status) {
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Explain the decline reason',
                message:
                  'Are you going to message to explain the error of this declining?',
                confirmLabel: 'Message',
                cancelLabel: 'Skip'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (answer) {
                if (this.isOrganizer) {
                  this.messageLeader();
                } else {
                  this.messageOrganizer();
                }
              }
              // this.dialogRef.close({
              //   action: 'update',
              //   data: {
              //     status: 'declined'
              //   },
              //   id: this.call._id
              // });
            });
        }
      });
  }

  accept(): void {
    let callTime;
    if (this.selectedTime === 'custom') {
      if (this.userTimezone.tz_name) {
        const dateStr = `${this.customDateTimes[0].date.year}-${numPad(
          this.customDateTimes[0].date.month
        )}-${numPad(this.customDateTimes[0].date.day)} ${
          this.customDateTimes[0].time
        }`;
        callTime = moment.tz(dateStr, this.userTimezone.tz_name).format();
      } else {
        callTime = `${this.customDate.year}-${numPad(
          this.customDate.month
        )}-${numPad(this.customDate.day)}T${this.customTime}${
          this.userTimezone.zone
        }`;
      }
    } else {
      callTime = this.selectedTime;
    }
    this.accepting = true;
    this.teamService
      .updateCall(this.call._id, {
        status: 'planned',
        confirmed_at: callTime
      })
      .subscribe((status) => {
        this.accepting = false;
        if (status) {
          // Check the Calendar Connection
          const calendars = this.appointmentService.calendars.getValue();
          if (!calendars || !calendars.length) {
            // this.dialogRef.close({
            //   action: 'update',
            //   data: {
            //     status: 'planned',
            //     confirmed_at: callTime
            //   },
            //   id: this.call._id
            // });
            return;
          }
          this.dialog
            .open(ConfirmComponent, {
              ...DialogSettings.CONFIRM,
              data: {
                title: 'Add the call to Calendar',
                message: 'Are you going to add this call to your calendar?',
                confirmLabel: 'Add to calendar',
                cancelLabel: 'Cancel'
              }
            })
            .afterClosed()
            .subscribe((answer) => {
              if (answer) {
                this.addToCalendar(callTime);
              }
              // this.dialogRef.close({
              //   action: 'update',
              //   data: {
              //     status: 'planned',
              //     confirmed_at: callTime
              //   },
              //   id: this.call._id
              // });
            });
        }
      });
  }

  addToCalendar(callTime): void {
    const contacts = [];
    if (this.call && this.call.leader) {
      contacts.push(this.call.leader);
    }
    if (this.call && this.call.user) {
      if (this.call.leader && this.call.leader._id !== this.call.user._id) {
        contacts.push(this.call.user);
      }
    }

    this.dialog.open(CalendarDialogComponent, {
      width: '100vw',
      maxWidth: '600px',
      data: {
        call: this.call,
        confirmed_at: callTime,
        contacts
      }
    });
  }

  messageLeader(): void {
    this.dialog.open(CallRequestCancelComponent, {
      width: '98vw',
      maxWidth: '480px',
      data: {
        call: this.call,
        title: 'Message Leader',
        message: '',
        type: 'leader'
      }
    });
  }

  messageOrganizer(): void {
    this.dialog.open(CallRequestCancelComponent, {
      width: '98vw',
      maxWidth: '480px',
      data: {
        call: this.call,
        title: 'Message Organizer',
        message: '',
        type: 'organizer'
      }
    });
  }

  contactDetail(contact): void {
    if (contact && contact._id) {
      if (this.isOrganizer) {
        window.open('/contacts/' + contact._id, '_blank');
      } else {
        // this.dialog.open(ContactDetailComponent, {
        //   ...DialogSettings.CONTACT,
        //   data: {
        //     contact
        //   }
        // });
      }
    }
  }

  removeCustomDateTime(dateTime): void {
    if (this.customDateTimes.length < 2) {
      return;
    }
    const index = this.customDateTimes.findIndex(
      (item) => item.id === dateTime.id
    );
    this.customDateTimes.splice(index, 1);
  }

  addCustomDateTime(): void {
    this.customDateTimes.push({
      id: Date.now(),
      date: this.MIN_DATE,
      time: '15:00:00.000'
    });
  }

  showProfile(contact): void {
    this.dialog.open(TeamMemberProfileComponent, {
      data: {
        title: 'Team member',
        member: contact
      }
    });
  }
}
