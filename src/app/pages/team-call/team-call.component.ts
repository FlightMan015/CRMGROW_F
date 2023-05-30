import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { TeamService } from '../../services/team.service';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CallRequestCancelComponent } from '../../components/call-request-cancel/call-request-cancel.component';
import { CallRequestScheduledComponent } from '../../components/call-request-scheduled/call-request-scheduled.component';
import { JoinCallRequestComponent } from '../../components/join-call-request/join-call-request.component';
import * as moment from 'moment';
import { CalendarDialogComponent } from '../../components/calendar-dialog/calendar-dialog.component';
import { Subscription } from 'rxjs';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { DialogSettings } from 'src/app/constants/variable.constants';
import { CallRequestDetailComponent } from 'src/app/components/call-request-detail/call-request-detail.component';
import * as _ from 'lodash';
import { AppointmentService } from 'src/app/services/appointment.service';
import { getCurrentTimezone, numPad, searchReg } from '../../helper';
import { TeamMemberProfileComponent } from '../../components/team-member-profile/team-member-profile.component';
import {
  sortDateArray,
  sortObjectArray,
  sortStringArray
} from '../../utils/functions';
import { HandlerService } from '../../services/handler.service';
@Component({
  selector: 'app-team-call',
  templateUrl: './team-call.component.html',
  styleUrls: ['./team-call.component.scss']
})
export class TeamCallComponent implements OnInit, OnDestroy, AfterViewInit {
  TABS: any[] = [
    { id: 'inquiry', label: 'Inquiries' },
    { id: 'sent', label: 'Sent' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'completed', label: 'Completed' },
    { id: 'canceled', label: 'Canceled' },
    { id: 'denied', label: 'Denied' }
  ];
  selectedTab = this.TABS[0];
  pageSize = { id: 8, label: '8' };

  currentUser: any;
  userId = '';
  userTimezone;
  teams: any[] = [];

  pageData: any = {
    inquiry: [],
    sent: [],
    scheduled: [],
    completed: [],
    canceled: [],
    denied: []
  };
  loading: any = {
    inquiry: false,
    sent: false,
    scheduled: false,
    completed: false,
    canceled: false,
    denied: false
  };
  total: any = {
    inquiry: 0,
    sent: 0,
    scheduled: 0,
    completed: 0,
    canceled: 0,
    denied: 0
  };
  page: any = {
    inquiry: 0,
    sent: 0,
    scheduled: 0,
    completed: 0,
    canceled: 0,
    denied: 0
  };
  subscriptions: any = {};

  profileSubscription: Subscription;
  searchCondition = {
    inquiry: {
      subject: false,
      organizer: false,
      proposed: false,
      inquired: false
    },
    sent: {
      subject: false,
      leader: false,
      contacts: false,
      proposed: false
    },
    scheduled: {
      subject: false,
      organizer: false,
      leader: false,
      contacts: false,
      schedule: false
    },
    completed: {
      subject: false,
      organizer: false,
      leader: false,
      contacts: false,
      schedule: false
    },
    canceled: {
      subject: false,
      organizer: false,
      leader: false,
      contacts: false,
      schedule: false
    },
    denied: {
      subject: false,
      organizer: false,
      leader: false,
      contacts: false,
      schedule: false
    }
  };

  selectedSort = {
    inquiry: 'subject',
    sent: 'proposed',
    scheduled: 'schedule',
    complete: 'schedule',
    canceled: 'schedule',
    denied: 'schedule'
  };

  isShowDialog = false;

  searchStr = '';

  constructor(
    private teamService: TeamService,
    private dialog: MatDialog,
    private userService: UserService,
    private appointmentService: AppointmentService,
    private location: Location,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private router: Router,
    private handlerService: HandlerService
  ) {}

  ngOnInit(): void {
    this.appointmentService.loadCalendars(false);

    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((res) => {
      this.currentUser = res;
      this.userId = res._id;
      try {
        this.userTimezone = JSON.parse(res.time_zone_info);
      } catch (err) {
        const timezone = getCurrentTimezone();
        this.userTimezone = { zone: res.time_zone || timezone };
      }
    });

    this.TABS.forEach((e) => {
      this.loadPageCalls(e.id, 0);
    });
    // this.changeTab(this.TABS[0]);
  }

  ngAfterViewInit(): void {
    const groupId = this.route.snapshot.params.group;
    const callId = this.route.snapshot.params.id;
    const previousUrl = this.handlerService.previousUrl;
    const tabIndex = this.TABS.findIndex((item) => item.id === groupId);
    if (tabIndex >= 0) {
      this.changeTab(this.TABS[tabIndex]);
    }

    if (callId) {
      this.teamService.getCallById(callId).subscribe((res) => {
        const call = res;
        if (call) {
          if (!previousUrl || !previousUrl.includes('teams/call')) {
            if (call && call.status) {
              if (call.status === 'pending') {
                if (call.leader && call.leader._id === this.userId) {
                  this.changeTab(this.TABS[0]);
                } else {
                  this.changeTab(this.TABS[1]);
                }
              } else if (call.status === 'planned') {
                this.changeTab(this.TABS[2]);
              } else if (call.status === 'finished') {
                this.changeTab(this.TABS[3]);
              } else if (call.status === 'canceled') {
                this.changeTab(this.TABS[4]);
              } else if (call.status === 'declined') {
                this.changeTab(this.TABS[5]);
              }
            }
            this.openCall(call);
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    for (const type in this.subscriptions) {
      this.subscriptions[type] && this.subscriptions[type].unsubscribe();
    }
  }

  changeTab(tab: any): void {
    this.selectedTab = tab;
    this.location.replaceState(`/teams/call/${tab.id}`);
    this.loadPageCalls(tab.id, 0);
  }

  loadPageCalls(type: string, page: number): void {
    let skip = 0;
    if (page) {
      this.page[type] = page;
      skip = (page - 1) * this.pageSize.id;
    } else {
      this.page[type] = 1;
      skip = 0;
    }

    this.loading[type] = true;
    this.subscriptions[type] && this.subscriptions[type].unsubscribe();
    this.subscriptions[type] = this.teamService
      .loadTeamCalls(type, skip, this.pageSize.id)
      .subscribe((res) => {
        this.loading[type] = false;
        if (res) {
          this.total[type] = res['total'];
          this.pageData[type] = res['data'];
        }
        if (type === this.TABS[0].id || type === this.TABS[1].id) {
          this.sort(type, 'proposed', false, true);
        } else {
          this.sort(type, 'schedule', false, true);
        }
      });
  }

  changePage(page: number): void {
    this.loadPageCalls(this.selectedTab.id, page);
  }

  joinCallRequest(): void {
    this.dialog
      .open(JoinCallRequestComponent, {
        width: '96vw',
        maxWidth: '500px',
        height: 'auto',
        disableClose: true,
        data: {
          teams: this.teams
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.loadPageCalls('sent', this.page['sent']);
          this.changeTab(this.TABS[1]);
        }
      });
  }

  getGroup(call): any {
    let group;
    if (call.status === 'pending') {
      if (call.leader && call.leader._id === this.userId) {
        group = this.TABS[0];
      } else {
        group = this.TABS[1];
      }
    } else if (call.status === 'planned') {
      group = this.TABS[2];
    } else if (call.status === 'finished') {
      group = this.TABS[3];
    } else if (call.status === 'canceled') {
      group = this.TABS[4];
    } else if (call.status === 'declined') {
      group = this.TABS[5];
    }
    return group;
  }

  openCall(call): void {
    const groupId = this.getGroup(call).id;
    this.location.replaceState(`/teams/call/${groupId}/${call._id}`);
    this.dialog
      .open(CallRequestDetailComponent, {
        width: '98vw',
        maxWidth: '500px',
        height: 'auto',
        data: {
          call
        }
      })
      .afterClosed()
      .subscribe((data) => {
        this.isShowDialog = false;
        this.location.replaceState(`/teams/call/${groupId}`);
        if (data) {
          const currentTab = this.selectedTab.id;
          let newTab;
          if (data.action === 'delete') {
            _.remove(this.pageData[currentTab], (e) => {
              return e._id === call._id;
            });
            this.total[currentTab]--;
          } else {
            if (data.action === 'update') {
              if (data.data.status === 'finished') {
                newTab = 'completed';
              } else if (data.data.status === 'planned') {
                newTab = 'scheduled';
              } else if (data.data.status === 'declined') {
                newTab = 'denied';
              }
              this.pageData[newTab].unshift({
                ...call,
                ...data.data
              });
              _.remove(this.pageData[currentTab], (e) => {
                return e._id === call._id;
              });
              this.total[currentTab]--;
              this.total[newTab]++;
              if (
                this.pageData[currentTab].length < 5 &&
                this.total[currentTab] > 8
              ) {
                this.loadPageCalls(currentTab, this.page[currentTab]);
              }
            } else if (data.action === 'cancel') {
              this.pageData[currentTab].some((e) => {
                if (e._id === call._id) {
                  e['note'] = data.note;
                  return true;
                }
              });
            }
          }
        }
      });
  }

  edit(call): void {
    this.dialog
      .open(JoinCallRequestComponent, {
        width: '96vw',
        maxWidth: '500px',
        height: 'auto',
        disableClose: true,
        data: {
          type: 'edit',
          callData: call
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.loadPageCalls('sent', this.page['sent']);
        }
      });
  }

  reschedule(call): void {
    this.dialog
      .open(JoinCallRequestComponent, {
        width: '96vw',
        maxWidth: '500px',
        height: 'auto',
        disableClose: true,
        data: {
          type: 'reschedule',
          callData: call
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const currentTab = this.selectedTab.id;
          this.loadPageCalls(currentTab, this.page[currentTab]);
          this.loadPageCalls('sent', this.page['sent']);
        }
      });
  }

  complete(call): void {
    this.teamService
      .updateCall(call._id, {
        status: 'finished'
      })
      .subscribe((status) => {
        if (status) {
          const currentTab = this.selectedTab.id;
          this.loadPageCalls(currentTab, this.page[currentTab]);
          this.loadPageCalls('completed', this.page['completed']);
        }
      });
  }

  delete(call): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Delete group call',
          message: 'Are you sure to delete this group call?',
          confirmLabel: 'Delete'
        }
      })
      .afterClosed()
      .subscribe((answer) => {
        if (answer) {
          const currentTab = this.selectedTab.id;
          this.teamService.deleteCall(call._id).subscribe((status) => {
            if (status) {
              _.remove(this.pageData[currentTab], (e) => {
                return e._id === call._id;
              });
              this.total[currentTab]--;
              if (
                this.pageData[currentTab].length < 5 &&
                this.total[currentTab] > 8
              ) {
                this.loadPageCalls(currentTab, this.page[currentTab]);
              }
            }
          });
        }
      });
  }

  decline(call): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Decline group call',
          message: 'Are you sure to decline this group call?',
          confirmLabel: 'Decline'
        }
      })
      .afterClosed()
      .subscribe((answer) => {
        if (answer) {
          this.teamService
            .updateCall(call._id, { status: 'declined' })
            .subscribe((status) => {
              if (status) {
                this.pageData['denied'].unshift({
                  ...call,
                  status: 'declined'
                });
                _.remove(this.pageData['inquiry'], (e) => {
                  return e._id === call._id;
                });
                this.total['inquiry']--;
                this.total['denied']++;
                if (
                  this.pageData['inquiry'].length < 5 &&
                  this.total['inquiry'] > 8
                ) {
                  const currentTab = this.selectedTab.id;
                  this.loadPageCalls(currentTab, this.page[currentTab]);
                  this.loadPageCalls('denied', this.page['denied']);
                }
              }
            });
        }
      });
  }

  accept(call): void {
    const selectedTime = call.proposed_at[0];
    this.teamService
      .updateCall(call._id, {
        status: 'planned',
        confirmed_at: selectedTime
      })
      .subscribe((status) => {
        if (status) {
          const currentTab = this.selectedTab.id;
          _.remove(this.pageData[currentTab], (e) => {
            return e._id === call._id;
          });
          this.total[currentTab]--;
          if (
            this.pageData[currentTab].length < 5 &&
            this.total[currentTab] > 8
          ) {
            this.loadPageCalls(currentTab, this.page[currentTab]);
            this.loadPageCalls('scheduled', this.page['scheduled']);
          }
          // Check the Calendar Connection
          const calendars = this.appointmentService.calendars.getValue();
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
                this.addToCalendar(call);
              }
            });
        }
      });
  }

  addToCalendar(call): void {
    const contacts = [];
    if (call && call.leader) {
      contacts.push(call.leader);
    }

    if (call && call.user) {
      if (call.leader && call.leader._id !== call.user._id) {
        contacts.push(call.user);
      }
    }

    this.dialog.open(CalendarDialogComponent, {
      width: '100vw',
      maxWidth: '600px',
      data: {
        call,
        contacts
      }
    });
  }

  cancel(call): void {
    this.dialog
      .open(ConfirmComponent, {
        ...DialogSettings.CONFIRM,
        data: {
          title: 'Cancel group call',
          message: 'Are you sure to cancel this group call?',
          confirmLabel: 'Cancel'
        }
      })
      .afterClosed()
      .subscribe((answer) => {
        if (answer) {
          const currentTab = this.selectedTab.id;
          this.teamService
            .updateCall(call._id, { status: 'canceled' })
            .subscribe((status) => {
              if (status) {
                this.pageData['canceled'].unshift({
                  ...call,
                  status: 'canceled'
                });
                _.remove(this.pageData[currentTab], (e) => {
                  return e._id === call._id;
                });
                this.total[currentTab]--;
                this.total['canceled']++;
                if (
                  this.pageData[currentTab].length < 5 &&
                  this.total[currentTab] > 8
                ) {
                  this.loadPageCalls(currentTab, this.page[currentTab]);
                }
              }
            });
        }
      });
  }

  cancelInquiry(inquiry): void {
    inquiry.status = 'canceled';
    this.teamService.updateCall(inquiry._id, inquiry).subscribe(
      (res) => {
        if (res) {
          const result = {
            inquiry_id: inquiry._id,
            status: 'canceled'
          };

          this.dialog
            .open(CallRequestCancelComponent, {
              width: '96vw',
              maxWidth: '600px',
              height: 'auto',
              disableClose: true,
              data: {
                data: inquiry
              }
            })
            .afterClosed()
            .subscribe((response) => {
              // this.loadInquiriesPage(this.currentInquiriesPage);
              // this.loadFinishedPage(this.currentFinishedPage);
            });

          // this.loadInquiriesPage(this.currentInquiriesPage);
          // this.loadFinishedPage(this.currentFinishedPage);
          // this.signalService.inquiryUpdateSignal(result)
        }
      },
      (error) => {}
    );
  }

  getDuration(duration): string {
    if (duration === 60) {
      return '1 hour';
    }
    return `${duration} mins`;
  }

  scheduleCall(plan): void {
    this.location.replaceState('/teams/call/' + plan._id);
    const status = plan.status;
    this.dialog
      .open(CallRequestScheduledComponent, {
        width: '96vw',
        maxWidth: '600px',
        height: 'auto',
        disableClose: true,
        data: {
          plan
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.data.status === 'canceled') {
            if (status === 'pending') {
              this.dialog
                .open(CallRequestCancelComponent, {
                  width: '96vw',
                  maxWidth: '600px',
                  height: 'auto',
                  disableClose: true,
                  data: {
                    data: plan
                  }
                })
                .afterClosed()
                .subscribe((response) => {
                  // this.loadPlannedPage(this.currentInquiriesPage);
                  // this.loadFinishedPage(this.currentFinishedPage);
                });
            }
            // this.loadPlannedPage(this.currentInquiriesPage);
            // this.loadFinishedPage(this.currentFinishedPage);
          }
        }
        this.location.replaceState('/teams');
      });
  }
  editGroupCall(plan): void {}

  changePageSize(type: any): void {
    this.pageSize = type;
    this.changePage(this.page);
  }

  isOrganizer(call): any {
    if (call && call.user) {
      return call.user._id === this.userId;
    }
    return false;
  }

  showProfile(contact): void {
    if (contact) {
      this.dialog.open(TeamMemberProfileComponent, {
        data: {
          title: 'Team member',
          member: contact
        }
      });
    }
  }

  isSelectedSort(group, type): boolean {
    return this.selectedSort[group] === type;
  }

  getSearchCondition(group, type): boolean {
    return this.searchCondition[group][type];
  }

  getAvatarName(contact): any {
    if (contact.first_name && contact.last_name) {
      return contact.first_name[0] + contact.last_name[0];
    } else if (contact.first_name && !contact.last_name) {
      return contact.first_name[0];
    } else if (!contact.first_name && contact.last_name) {
      return contact.last_name[0];
    }
    return 'UC';
  }

  getContactName(contact): any {
    if (contact.first_name && contact.last_name) {
      return contact.first_name + ' ' + contact.last_name;
    } else if (contact.first_name) {
      return contact.first_name;
    } else if (contact.last_name) {
      return contact.last_name;
    } else {
      return 'Unnamed Contact';
    }
  }

  sort(group, type, goFirstPage: boolean = false, keep: boolean = false): void {
    if (this.selectedSort[group] !== type) {
      this.selectedSort[group] = type;
      return;
    } else {
      if (type === 'organizer' || type === 'leader') {
        this.pageData[group] = sortObjectArray(
          this.pageData[group],
          type,
          this.getSearchCondition(group, type)
        );
      } else if (
        type === 'inquired' ||
        type === 'proposed' ||
        type === 'schedule'
      ) {
        this.pageData[group] = sortDateArray(
          this.pageData[group],
          type,
          this.getSearchCondition(group, type)
        );
      } else {
        this.pageData[group] = sortStringArray(
          this.pageData[group],
          type,
          this.getSearchCondition(group, type)
        );
      }

      if (goFirstPage) {
        this.page[group] = 0;
      }

      if (!keep) {
        this.searchCondition[group][type] = !this.searchCondition[group][type];
      }
    }
  }

  changeSearchStr(): void {}

  clearSearchStr(): void {
    this.searchStr = '';
    this.changeSearchStr();
  }
}
