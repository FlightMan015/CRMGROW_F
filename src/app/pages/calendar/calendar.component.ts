import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Input,
  ViewContainerRef,
  ViewChild,
  TemplateRef,
  HostListener,
  OnDestroy
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentService } from 'src/app/services/appointment.service';
import { OverlayService } from 'src/app/services/overlay.service';
import { CalendarEvent, CalendarView } from 'angular-calendar';
import { CalendarDialogComponent } from '../../components/calendar-dialog/calendar-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { startOfWeek, endOfWeek } from 'date-fns';
import { UserService } from 'src/app/services/user.service';
import { TabItem } from 'src/app/utils/data.types';
import { Subject, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import * as moment from 'moment';
import * as _ from 'lodash';
import { DetailErrorComponent } from 'src/app/components/detail-error/detail-error.component';
import { ConnectNewCalendarComponent } from '../../components/connect-new-calendar/connect-new-calendar.component';
import { CalendarSettingComponent } from 'src/app/components/calendar-setting/calendar-setting.component';
import { Garbage } from 'src/app/models/garbage.model';
import { GetTime } from 'src/app/helper';

const ZONEREG = /-[0-1][0-9]:00|Z/;
@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  garbage: Garbage = new Garbage();
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  today: Date = new Date();

  @Input() locale = 'en';
  public user: any = {};
  weekStart;
  weekEnd;

  isLoading = false;
  loadSubscription: Subscription;
  anotherLoadSubscriptions = {};
  isUpdating = false;
  isWorking = false;
  isRedirect = false;

  tabs: TabItem[] = [
    { icon: '', label: 'Day', id: 'day' },
    { icon: '', label: 'Week', id: 'week' },
    { icon: '', label: 'Month', id: 'month' }
  ];
  selectedTab: TabItem = this.tabs[0];
  queryParamSubscription: Subscription;

  // Calendars
  events: CalendarEvent[] = [];
  dayEvents: any = {};
  showingEvents: CalendarEvent[] = [];
  supplementEvents = {};
  supplementDays: any[] = [];

  // Event id from router
  eventId: string = '';

  // Calendars
  accounts: any[] = [];
  calendars = {};
  selectedCalendars = [];
  isShowCalendarList = false;

  // Overlay Relative
  @ViewChild('detailPortalContent') detailPortalContent: TemplateRef<unknown>;
  @ViewChild('creatPortalContent') creatPortalContent: TemplateRef<unknown>;
  overlayRef: OverlayRef;
  templatePortal: TemplatePortal;
  event: any;
  selectedDate: any;
  overlayCloseSubscription: Subscription;

  // Relative Subscriptions
  updateCommandSubscription: Subscription;
  calendarLoadSubscription: Subscription;
  profileSubscription: Subscription;
  garbageSubscription: Subscription;
  isPackageCalendar = true;

  constructor(
    private dialog: MatDialog,
    private appointmentService: AppointmentService,
    private overlayService: OverlayService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private changeDetectorRef: ChangeDetectorRef,
    private viewContainerRef: ViewContainerRef,
    private toast: ToastrService,
    private overlay: Overlay,
    private _viewContainerRef: ViewContainerRef
  ) {
    this.garbageSubscription = this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
      if (this.garbage.calendar_info) {
        this.isWorking = this.garbage.calendar_info.is_enabled;
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  ngOnInit(): void {
    this.appointmentService.loadCalendars(true);
    this.initSubscriptions();
    this.initModeAndDate();
  }

  ngOnDestroy(): void {
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.updateCommandSubscription &&
      this.updateCommandSubscription.unsubscribe();
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    // Unsubscribe the supplement events load
    // Set the current Day & mode & events
    // this.appointmentService.currentMethod.next(this.view);
    this.appointmentService.selectedCalendars.next(this.selectedCalendars);
  }

  initModeAndDate(): void {
    const currentDay = new Date();
    const currentMethod = localStorage.getItem('calendarTab');
    let date;
    let mode =
      this.route.snapshot.params['mode'] ||
      this.route.snapshot.params['action'] ||
      currentMethod ||
      'week';
    const year = this.route.snapshot.params['year'];
    const month = this.route.snapshot.params['month'];
    const day = this.route.snapshot.params['day'];
    const routeDay = new Date(`${year}-${month}-${day}`);
    if (isNaN(routeDay.getTime())) {
      date = moment(currentDay);
    } else {
      date = moment(routeDay);
    }

    switch (mode) {
      case 'month':
        date = date.startOf('month');
        this.selectedTab = this.tabs[2];
        this.view = CalendarView.Month;
        break;
      case 'week':
        date = date.startOf('week');
        this.selectedTab = this.tabs[1];
        this.view = CalendarView.Week;
        break;
      case 'day':
        date = date.startOf('day');
        this.selectedTab = this.tabs[0];
        this.view = CalendarView.Day;
        break;
      default:
        mode = 'week';
        date = date.startOf('week');
        this.selectedTab = this.tabs[1];
        this.view = CalendarView.Week;
    }

    this.location.replaceState(
      `/calendar/${mode}/${date.year()}/${date.month() + 1}/${date.date()}${
        this.eventId ? '?event=' + this.eventId : ''
      }`
    );

    this.events = this.appointmentService.currentEvents.getValue() || [];
    this.filterEvents();

    const isoDate = date.toISOString();
    this.viewDate = new Date(isoDate);
    if (mode === 'week') {
      this.weekStart = startOfWeek(this.viewDate);
      this.weekEnd = endOfWeek(this.viewDate);
    }
    this.load(isoDate, mode);

    if (this.view === CalendarView.Day || this.view === CalendarView.Week) {
      const index = this.view === CalendarView.Day ? 9 : 7;
      setTimeout(() => {
        const dom = <HTMLElement>(
          document.querySelector(`.cal-hour:nth-child(${index})`)
        );
        if (dom) {
          const offsetTop = dom.offsetTop;
          window.scrollTo({ top: offsetTop });
        }
      }, 300);
    }
  }

  initSubscriptions(): void {
    // Profile Load Subscription
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe(
      (profile) => {
        this.user = profile;
        this.isPackageCalendar = profile.calendar_info?.is_enabled;
      }
    );

    // Router Load Subscription
    this.queryParamSubscription && this.queryParamSubscription.unsubscribe();
    this.queryParamSubscription = this.route.queryParams.subscribe((params) => {
      if (params['code']) {
        const action = this.route.snapshot.params['action'];
        if (action == 'outlook') {
          this.userService
            .authorizeOutlookCalendar(params['code'])
            .subscribe((res) => {
              if (res['status']) {
                const data = {
                  connected_calendar_type: 'outlook',
                  connected_email: res['data'],
                  outlook_refresh_token: params['code']
                };
                this.user.calendar_list.push(data);
                if (
                  !this.user.onboard.connect_calendar &&
                  this.user.user_version >= 2.1
                ) {
                  this.user.onboard.connect_calendar = true;
                  this.isRedirect = true;
                  this.userService
                    .updateProfile({
                      onboard: this.user.onboard
                    })
                    .subscribe(() => {
                      this.userService.updateProfileImpl({
                        onboard: this.user.onboard
                      });
                    });
                } else {
                  this.isRedirect = false;
                  this.userService.updateProfileImpl(this.user);
                }
                // this.toast.success(
                //   'Your Outlook Calendar is connected successfully.'
                // );
                if (this.isRedirect) {
                  this.router.navigate(['/contacts']);
                } else {
                  this.router.navigate(['/settings/integration']);
                }
              }
            });
        }
        if (action == 'google') {
          this.userService
            .authorizeGoogleCalendar(params['code'])
            .subscribe((res) => {
              if (res['status']) {
                const data = {
                  connected_calendar_type: 'google',
                  connected_email: res['data'],
                  google_refresh_token: params['code']
                };
                this.user.calendar_list.push(data);
                if (!this.user.onboard.connect_calendar) {
                  this.user.onboard.connect_calendar = true;
                  this.isRedirect = true;
                  this.userService
                    .updateProfile({
                      onboard: this.user.onboard
                    })
                    .subscribe(() => {
                      this.userService.updateProfileImpl({
                        onboard: this.user.onboard
                      });
                    });
                } else {
                  this.isRedirect = false;
                  this.userService.updateProfileImpl(this.user);
                }
                // this.toast.success(
                //   'Your Google Calendar is connected successfully.'
                // );
                if (this.isRedirect) {
                  this.router.navigate(['/contacts']);
                } else {
                  this.router.navigate(['/settings/integration']);
                }
              }
            });
        }
      }

      if (params['event']) {
        this.eventId = params['event'];
      }
    });

    // Load Calendars
    this.calendarLoadSubscription &&
      this.calendarLoadSubscription.unsubscribe();
    this.calendarLoadSubscription = this.appointmentService.calendars$.subscribe(
      (data) => {
        this.accounts = [];
        this.calendars = {};
        this.selectedCalendars = this.appointmentService.selectedCalendars.getValue();
        const selectedCalendars = [];
        if (data) {
          data.forEach((account) => {
            const acc = { email: account.email };
            if (account.data) {
              const calendars = [];
              account.data.forEach((e) => {
                calendars.push({ ...e, account: account.email });
                selectedCalendars.push(e.id);
                this.calendars[e.id] = e;
              });
              acc['calendars'] = calendars;
              this.accounts.push(acc);
            }
          });
          const allCalendarIds = Object.keys(this.calendars);
          if (this.selectedCalendars.length) {
            for (let i = this.selectedCalendars.length - 1; i >= 0; i--) {
              const e = this.selectedCalendars[i];
              if (allCalendarIds.indexOf(e) === -1) {
                this.selectedCalendars.splice(i, 1);
              }
            }
          }

          if (!this.selectedCalendars.length) {
            this.selectedCalendars = [...selectedCalendars];
          }
        }
      }
    );

    this.updateCommandSubscription &&
      this.updateCommandSubscription.unsubscribe();
    this.updateCommandSubscription = this.appointmentService.updateCommand$.subscribe(
      (data) => {
        if (data) {
          if (data.command === 'delete') {
            if (data.data.recurrence_id) {
              const events = this.events.filter((e) => {
                if (e.meta.recurrence_id !== data.data.recurrence_id) {
                  return true;
                }
              });
              this.events = events;
            } else {
              this.events.some((e, index) => {
                if (e.meta.event_id === data.data.event_id) {
                  this.events.splice(index, 1);
                  return true;
                }
              });
            }
            this.filterEvents();
          } else if (data.command === 'update') {
            const event = data.data;
            const _formattedEvent = this._convertStandard2Mine(event);
            if (event.recurrence_id) {
              this.events.forEach((e) => {
                if (e.meta.recurrence_id === event.recurrence_id) {
                  for (const key in _formattedEvent) {
                    e[key] = _formattedEvent[key];
                  }
                }
              });
              this.reload();
            } else {
              // update only this event
              const originalEventIndex = _.findIndex(
                this.events,
                (e) => e.meta.event_id === event.event_id
              );
              const originalEvent = this.events[originalEventIndex];
              for (const key in _formattedEvent) {
                originalEvent[key] = _formattedEvent[key];
              }
            }
          } else if (data.command === 'accept') {
            const acceptData = data.data;
            if (acceptData.recurrence_id) {
              this.events.forEach((e) => {
                if (e.meta.recurrence_id === acceptData.recurrence_id) {
                  this.acceptEvent(e, acceptData.connected_email);
                }
              });
            } else {
              const originalEventIndex = _.findIndex(
                this.events,
                (e) => e.meta.event_id === acceptData.event_id
              );
              const originalEvent = this.events[originalEventIndex];
              this.acceptEvent(originalEvent, acceptData.connected_email);
            }
          } else if (data.command === 'decline') {
            const declineData = data.data;
            if (declineData.recurrence_id) {
              this.events.forEach((e) => {
                if (e.meta.recurrence_id === declineData.recurrence_id) {
                  this.declineEvent(e, declineData.connected_email);
                }
              });
            } else {
              const originalEventIndex = _.findIndex(
                this.events,
                (e) => e.meta.event_id === declineData.event_id
              );
              const originalEvent = this.events[originalEventIndex];
              this.declineEvent(originalEvent, declineData.connected_email);
            }
          } else if (data.command === 'recurrence') {
            this.reload();
          }
        }
      }
    );
  }

  load(date: string, mode: string): void {
    let durationDays = [];
    let nextDurationStart;
    let next2DurationStart;
    let prevDurationStart;
    let prev2DurationStart;
    switch (mode) {
      case 'month':
        nextDurationStart = moment(date).startOf('month').add(1, 'months');
        next2DurationStart = moment(date).startOf('month').add(2, 'months');
        prevDurationStart = moment(date).startOf('month').subtract(1, 'months');
        prev2DurationStart = moment(date)
          .startOf('month')
          .subtract(2, 'months');
        durationDays = [
          prev2DurationStart,
          prevDurationStart,
          moment(date),
          nextDurationStart,
          next2DurationStart
        ];
        break;
      case 'week':
        nextDurationStart = moment(date).startOf('month');
        next2DurationStart = moment(date).startOf('month').add(1, 'months');
        prevDurationStart = moment(date).startOf('month').subtract(1, 'months');
        prev2DurationStart = moment(date)
          .startOf('month')
          .subtract(2, 'months');
        durationDays = [
          prev2DurationStart,
          prevDurationStart,
          nextDurationStart,
          next2DurationStart
        ];
        break;
      case 'day':
        nextDurationStart = moment(date).startOf('month');
        next2DurationStart = moment(date).startOf('month').add(1, 'months');
        prevDurationStart = moment(date).startOf('month').subtract(1, 'months');
        prev2DurationStart = moment(date)
          .startOf('month')
          .subtract(2, 'months');
        durationDays = [
          prev2DurationStart,
          prevDurationStart,
          nextDurationStart,
          next2DurationStart
        ];
        break;
    }
    const durationsToLoad = _.differenceBy(
      durationDays,
      this.supplementDays,
      (e) => e.toISOString()
    );
    const durationsToRemove = _.differenceBy(
      this.supplementDays,
      durationDays,
      (e) => e.toISOString()
    );
    const currentDatePos = _.findIndex(
      durationsToLoad,
      (e) => e.toISOString() === date
    );
    if (currentDatePos !== -1) {
      durationsToLoad.splice(currentDatePos, 1);
    }
    this.supplementDays = durationDays;

    // Fill with Preloaded Data
    const supplementEvents = Object.values(this.supplementEvents);
    let events = [];
    supplementEvents.forEach((e) => {
      if (e instanceof Array) {
        events = [...events, ...e];
      }
    });
    this.events = [...this.events, ...events];
    this.events = _.uniqBy(this.events, (e) => e.meta.event_id);
    // this.filterEvents();
    // Main Load
    this.loadEvent(date, mode);
    // Another Load
    this.anotherLoad(durationsToLoad, durationsToRemove);
  }

  loadEvent(date: string, mode: string): void {
    this.isLoading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.appointmentService
      .getEvents(date, mode)
      .subscribe((res) => {
        this.isLoading = false;
        if (res) {
          const _events = [];
          res.forEach((calendar) => {
            if (calendar['status']) {
              const subCalendars =
                calendar['calendar'] && calendar['calendar']['data'];
              subCalendars.forEach((subCalendar) => {
                const events = subCalendar.items;
                events.forEach((event) => {
                  let _start = moment(event.due_start).toDate();
                  let _end = moment(event.due_end).toDate();
                  if (event.service_type === 'outlook') {
                    if (!ZONEREG.test(event.due_start)) {
                      _start = moment(event.due_start + 'Z').toDate();
                    }
                    if (!ZONEREG.test(event.due_end)) {
                      _end = moment(event.due_end + 'Z').toDate();
                    }
                  }
                  const _formattedEvent = {
                    title: event.title,
                    start: _start,
                    end: _end,
                    meta: {
                      contacts: event.contacts,
                      calendar_id: event.calendar_id,
                      description: event.description,
                      location: event.location,
                      type: event.type,
                      guests: event.guests,
                      event_id: event.event_id,
                      recurrence: event.recurrence,
                      recurrence_id: event.recurrence_id,
                      is_organizer: event.is_organizer,
                      organizer: event.organizer,
                      timezone: event.timezone,
                      service_type: event.service_type
                    }
                  };
                  _events.push(_formattedEvent);
                });
              });
            }
          });
          this.events = _events;
          const supplementEvents = Object.values(this.supplementEvents);
          let _supplementEvents = [];
          supplementEvents.forEach((e) => {
            if (e instanceof Array) {
              _supplementEvents = [..._supplementEvents, ...e];
            }
          });
          this.events = [...this.events, ..._supplementEvents];
          this.events = _.uniqBy(this.events, (e) => e.meta.event_id);
          if (mode === 'month') {
            const end_date_string = moment(date).startOf('month').toISOString();
            this.supplementEvents[end_date_string] = _events;
          }

          const loadedDate = new Date(date);
          const currentDate = new Date();
          if (
            loadedDate.getMonth() === currentDate.getMonth() &&
            loadedDate.getFullYear() === currentDate.getFullYear()
          ) {
            this.appointmentService.currentEvents.next([..._events]);
          }

          this.filterEvents();
        }
      });
  }

  anotherLoad(daysToLoad: any[], daysToRemove: any[]): void {
    daysToRemove.forEach((duration) => {
      delete this.supplementEvents[duration.toISOString()];
    });
    daysToLoad.forEach((duration) => {
      this.anotherLoadSubscriptions[duration.toISOString()] &&
        this.anotherLoadSubscriptions[duration.toISOString()].unsubscribe();
      this.anotherLoadSubscriptions[
        duration.toISOString()
      ] = this.appointmentService
        .getEvents(duration.toISOString(), 'month')
        .subscribe((_events) => {
          if (_events) {
            this.mergeEvents(_events, duration);
          }
        });
    });
  }

  mergeEvents(_events, duration): void {
    const _results = [];
    _events.forEach((calendar) => {
      if (calendar['status']) {
        const subCalendars =
          calendar['calendar'] && calendar['calendar']['data'];
        subCalendars.forEach((subCalendar) => {
          const events = subCalendar.items;
          events.forEach((event) => {
            let _start = moment(event.due_start).toDate();
            let _end = moment(event.due_end).toDate();
            if (event.service_type === 'outlook') {
              if (!ZONEREG.test(event.due_start)) {
                _start = moment(event.due_start + 'Z').toDate();
              }
              if (!ZONEREG.test(event.due_end)) {
                _end = moment(event.due_end + 'Z').toDate();
              }
            }
            const _formattedEvent = {
              title: event.title,
              start: _start,
              end: _end,
              meta: {
                contacts: event.contacts,
                calendar_id: event.calendar_id,
                description: event.description,
                location: event.location,
                type: event.type,
                guests: event.guests,
                event_id: event.event_id,
                recurrence: event.recurrence,
                recurrence_id: event.recurrence_id,
                is_organizer: event.is_organizer,
                organizer: event.organizer,
                timezone: event.timezone,
                service_type: event.service_type
              }
            };
            _results.push(_formattedEvent);
          });
        });
      }
    });
    this.supplementEvents[duration.toISOString()] = _results;
    this.events = [...this.events, ..._results];
    this.events = _.uniqBy(this.events, (e) => e.meta.event_id);

    const loadedDate = new Date(duration.toISOString());
    const currentDate = new Date();
    if (
      loadedDate.getMonth() === currentDate.getMonth() &&
      loadedDate.getFullYear() === currentDate.getFullYear()
    ) {
      this.appointmentService.currentEvents.next([..._results]);
    }
  }

  reload(): any {
    const date = this.viewDate.toISOString();
    const mode = this.view;
    this.isUpdating = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.appointmentService
      .getEvents(date, mode)
      .subscribe((res) => {
        this.isUpdating = false;
        if (res) {
          const _events = [];
          res.forEach((calendar) => {
            if (calendar['status']) {
              const subCalendars =
                calendar['calendar'] && calendar['calendar']['data'];
              subCalendars.forEach((subCalendar) => {
                const events = subCalendar.items;
                events.forEach((event) => {
                  let _start = moment(event.due_start).toDate();
                  let _end = moment(event.due_end).toDate();
                  if (event.service_type === 'outlook') {
                    if (!ZONEREG.test(event.due_start)) {
                      _start = moment(event.due_start + 'Z').toDate();
                    }
                    if (!ZONEREG.test(event.due_end)) {
                      _end = moment(event.due_end + 'Z').toDate();
                    }
                  }
                  const _formattedEvent = {
                    title: event.title,
                    start: _start,
                    end: _end,
                    meta: {
                      contacts: event.contacts,
                      calendar_id: event.calendar_id,
                      description: event.description,
                      location: event.location,
                      type: event.type,
                      guests: event.guests,
                      event_id: event.event_id,
                      recurrence: event.recurrence,
                      recurrence_id: event.recurrence_id,
                      is_organizer: event.is_organizer,
                      organizer: event.organizer,
                      timezone: event.timezone,
                      service_type: event.service_type
                    }
                  };
                  _events.push(_formattedEvent);
                });
              });
            }
          });
          this.events = _events;
          const supplementEvents = Object.values(this.supplementEvents);
          let _supplementEvents = [];
          supplementEvents.forEach((e) => {
            if (e instanceof Array) {
              _supplementEvents = [..._supplementEvents, ...e];
            }
          });
          this.events = [...this.events, ..._supplementEvents];
          this.events = _.uniqBy(this.events, (e) => e.meta.event_id);
          if (mode === 'month') {
            const end_date_string = moment(date).startOf('month').toISOString();
            this.supplementEvents[end_date_string] = _events;
          }
          this.filterEvents();
        }
      });
  }

  getDayEvent(date: any): any {
    if (date) {
      try {
        const key = moment(date).format('YYYY-MM-DD');
        return this.dayEvents[key];
      } catch (err) {
        return [];
      }
    } else {
      const datesArr = Object.values(this.dayEvents);
      if (datesArr && datesArr.length) {
        return datesArr[0];
      } else {
        return [];
      }
    }
  }

  calendarSetting(): void {
    this.dialog
      .open(CalendarSettingComponent, {
        width: '100vw',
        maxWidth: '500px'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.reload();
        }
      });
  }

  isSelectedCalendar(calendar): boolean {
    if (this.selectedCalendars.indexOf(calendar.id) === -1) {
      return false;
    } else {
      return true;
    }
  }

  toggleCalendar(calendar): void {
    const pos = this.selectedCalendars.indexOf(calendar.id);
    if (pos === -1) {
      this.selectedCalendars.push(calendar.id);
    } else {
      this.selectedCalendars.splice(pos, 1);
    }
    this.filterEvents();
  }

  filterEvents(): void {
    this.dayEvents = {};
    this.showingEvents = [];
    this.events.forEach((e) => {
      if (this.selectedCalendars.indexOf(e.meta.calendar_id) !== -1) {
        if (this.isWorking) {
          const { startHour, startMin, endHour, endMin } = GetTime(
            this.garbage.calendar_info.start_time,
            this.garbage.calendar_info.end_time
          );
          if (
            (startHour < e.start.getHours() ||
              (startHour == e.start.getHours() &&
                startMin <= e.start.getMinutes())) &&
            (endHour > e.end.getHours() ||
              (endHour == e.end.getHours() && endMin >= e.end.getMinutes()))
          ) {
            if (
              this.view === 'month' ||
              e.start.getTime() !== e.end.getTime()
            ) {
              this.showingEvents.push(e);
            }
          }
        } else {
          if (this.view === 'month' || e.start.getTime() !== e.end.getTime()) {
            this.showingEvents.push(e);
          }
        }
        try {
          if (e.start.getTime() === e.end.getTime()) {
            const key = moment(e.start).format('YYYY-MM-DD');
            if (this.dayEvents[key]) {
              this.dayEvents[key].push(e);
            } else {
              this.dayEvents[key] = [e];
            }
          }
        } catch (e) {
          console.log('date compare error');
        }
      }
    });

    // Open the popup if the router has event id
    if (this.eventId) {
      this.events.some((e) => {
        if (
          this.eventId === e.meta.event_id ||
          e.meta.event_id.indexOf(this.eventId) !== -1
        ) {
          const domEle = `${moment(e.start).format('YYYY-MM-DD')}`;
          setTimeout(() => {
            const dom = document.querySelector(`[event^='${domEle}']`);
            if (dom) {
              this.openDetail(e, dom);
            }
            return true;
          }, 1000);
        }
      });
    }

    this.changeDetectorRef.detectChanges();
  }

  newEvent(): void {
    this.overlayService.close(null);
    this.dialog
      .open(CalendarDialogComponent, {
        width: '100vw',
        maxWidth: '600px',
        data: {
          user_email: this.user.email
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const newEvent = this._convertStandard2Original(res);
          const event = this._convertStandard2Mine(newEvent);

          if (event.meta.recurrence) {
            this.reload();
          } else {
            this.events.push(event);
            this.filterEvents();
          }
        }
      });
  }

  createEvent($event): void {
    const newEvent = this._convertStandard2Original($event);
    const event = this._convertStandard2Mine(newEvent);

    if (event.meta.recurrence) {
      this.reload();
    } else {
      this.events.push(event);
      this.filterEvents();
    }
  }

  acceptEvent(event, user_email): void {
    event.meta.guests.some((guest) => {
      if (guest.email === user_email) {
        guest.response = 'accepted';
        return true;
      }
    });
  }

  declineEvent(event, user_email): void {
    event.meta.guests.some((guest) => {
      if (guest.email === user_email) {
        guest.response = 'declined';
        return true;
      }
    });
  }

  changeTab(tab: TabItem): void {
    this.selectedTab = tab;
    switch (this.selectedTab.id) {
      case 'month':
        this.location.replaceState(
          `/calendar/month/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/1`
        );
        this.view = CalendarView.Month;
        break;
      case 'week':
        this.location.replaceState(
          `/calendar/week/${this.viewDate.getFullYear()}/${
            startOfWeek(this.viewDate).getMonth() + 1
          }/${startOfWeek(this.viewDate).getDate()}`
        );
        this.view = CalendarView.Week;
        this.weekStart = startOfWeek(this.viewDate);
        this.weekEnd = endOfWeek(this.viewDate);
        break;
      case 'day':
        const todayWeekStart = startOfWeek(this.today);
        const todayWeekEnd = endOfWeek(this.today);
        const weekStart = startOfWeek(this.viewDate);
        const weekEnd = endOfWeek(this.viewDate);
        if (
          todayWeekStart.getTime() === weekStart.getTime() &&
          todayWeekEnd.getTime() === weekEnd.getTime()
        ) {
          this.viewDate = this.today;
        }
        this.location.replaceState(
          `/calendar/day/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/${this.viewDate.getDate()}`
        );
        this.view = CalendarView.Day;
        break;
    }
    const isoDate = this.viewDate.toISOString();
    this.load(isoDate, this.selectedTab.id);

    if (this.view === CalendarView.Day || this.view === CalendarView.Week) {
      const index = this.view === CalendarView.Day ? 9 : 7;
      setTimeout(() => {
        const dom = <HTMLElement>(
          document.querySelector(`.cal-hour:nth-child(${index})`)
        );
        if (dom) {
          const offsetTop = dom.offsetTop;
          window.scrollTo({ top: offsetTop });
        }
      }, 300);
    }

    localStorage.setItem('calendarTab', this.selectedTab.id);
  }

  calendarDateChange(mode = ''): void {
    switch (this.view) {
      case 'month':
        this.location.replaceState(
          `/calendar/month/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/1`
        );
        break;
      case 'week':
        this.location.replaceState(
          `/calendar/week/${this.viewDate.getFullYear()}/${
            startOfWeek(this.viewDate).getMonth() + 1
          }/${startOfWeek(this.viewDate).getDate()}`
        );
        this.weekStart = startOfWeek(this.viewDate);
        this.weekEnd = endOfWeek(this.viewDate);
        break;
      case 'day':
        this.location.replaceState(
          `/calendar/day/${this.viewDate.getFullYear()}/${
            this.viewDate.getMonth() + 1
          }/${this.viewDate.getDate()}`
        );
        break;
    }
    const isoDate = this.viewDate.toISOString();
    this.load(isoDate, this.selectedTab.id);
  }

  addCalendar(): void {
    this.dialog.open(ConnectNewCalendarComponent, {
      width: '98vw',
      maxWidth: '420px'
    });
  }

  openOverlay(day: any, trigger: any): void {
    console.log('open overlay');
    const triggerEl = <HTMLElement>trigger;
    const originBounding = triggerEl.getBoundingClientRect();
    const originX = originBounding.x;
    const originY = originBounding.y;
    const originW = originBounding.width;
    const originH = originBounding.height;
    const originEndX = originX + originW;
    let originEndY = originY + originH;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    originEndY = originEndY > screenH - 30 ? screenH - 30 : originEndY;

    const size = {
      maxWidth: '550px',
      minWidth: '300px',
      maxHeight: 700,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (originX > 570) {
      // Set Right of overlay
      positionStrategy.left(originX - 570 + 'px');
    } else if (originX > 500) {
      positionStrategy.left(10 + 'px');
    } else if (screenW - originEndX > 570) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else if (screenW - originEndX > 500) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 600) {
      positionStrategy.centerVertically();
      size['height'] = screenH - 70;
    } else if (screenH - originY > 710) {
      positionStrategy.top(originY - 10 + 'px');
      size['height'] = 690;
    } else if (originEndY > 710) {
      positionStrategy.bottom(screenH - originEndY - 10 + 'px');
      size['height'] = 690;
    } else {
      positionStrategy.top('100px');
      size['height'] = screenH - 120;
    }

    this.templatePortal = new TemplatePortal(
      this.creatPortalContent,
      this._viewContainerRef
    );

    if (day && day.date) {
      this.selectedDate = day.date;
    } else {
      this.selectedDate = day;
    }

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        this.eventId = '';
      } else {
        this.overlayRef.updatePositionStrategy(positionStrategy);
        this.overlayRef.updateSize(size);
        this.overlayRef.attach(this.templatePortal);
      }
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.attach(this.templatePortal);
    }
    if (this.overlayRef) {
      this.overlayCloseSubscription &&
        this.overlayCloseSubscription.unsubscribe();
      this.overlayCloseSubscription = this.overlayRef
        .outsidePointerEvents()
        .subscribe((event) => {
          const targetEl = <HTMLElement>event.target;
          console.log(
            'calendar contact select trigger',
            targetEl,
            targetEl.closest('.cal-event'),
            targetEl.closest('.cal-month-cell'),
            targetEl.closest('.event-backdrop'),
            targetEl.closest('.event-panel'),
            targetEl.closest('.calendar-contact')
          );
          if (targetEl.closest('.cal-hour')) {
            return;
          }
          if (targetEl.closest('.cal-event')) {
            return;
          }
          if (targetEl.closest('.cal-month-cell')) {
            return;
          }
          if (targetEl.closest('.event-backdrop')) {
            return;
          }
          if (targetEl.closest('.event-panel')) {
            return;
          }
          if (targetEl.closest('.calendar-contact')) {
            return;
          }
          this.overlayRef.detach();
          this.eventId = '';
          return;
        });
    }
  }

  openDetail(event: any, trigger: any): void {
    this.event = event;

    const triggerEl = <HTMLElement>trigger;
    const originBounding = triggerEl.getBoundingClientRect();
    const originX = originBounding.x;
    const originY = originBounding.y;
    const originW = originBounding.width;
    const originH = originBounding.height;
    const originEndX = originX + originW;
    let originEndY = originY + originH;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    originEndY = originEndY > screenH - 30 ? screenH - 30 : originEndY;

    const size = {
      maxWidth: '360px',
      minWidth: '300px',
      maxHeight: 410,
      minHeight: 320
    };
    const positionStrategy = this.overlay.position().global();
    if (originX > 380) {
      // Set Right of overlay
      positionStrategy.left(originX - 380 + 'px');
    } else if (originX > 320) {
      positionStrategy.left(10 + 'px');
    } else if (screenW - originEndX > 380) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else if (screenW - originEndX > 320) {
      positionStrategy.left(originEndX + 20 + 'px');
    } else {
      positionStrategy.centerHorizontally();
    }

    if (screenH < 380) {
      positionStrategy.centerVertically();
      // size['height'] = screenH - 40;
    } else if (screenH - originY > 420) {
      positionStrategy.top(originY + 'px');
      // size['height'] = 420;
    } else if (originEndY > 420) {
      positionStrategy.bottom(screenH - originEndY + 'px');
      // size['height'] = 420;
    } else {
      positionStrategy.top('30px');
      // size['height'] = screenH - 50;
    }
    size['height'] = 'unset';

    this.templatePortal = new TemplatePortal(
      this.detailPortalContent,
      this._viewContainerRef
    );

    if (this.overlayRef) {
      if (this.overlayRef.hasAttached()) {
        this.overlayRef.detach();
        this.eventId = '';
      }
      this.overlayRef.updatePositionStrategy(positionStrategy);
      this.overlayRef.updateSize(size);
      this.overlayRef.attach(this.templatePortal);
    } else {
      this.overlayRef = this.overlay.create({
        scrollStrategy: this.overlay.scrollStrategies.block(),
        positionStrategy,
        ...size
      });
      this.overlayRef.attach(this.templatePortal);
    }
    if (this.overlayRef) {
      this.overlayCloseSubscription &&
        this.overlayCloseSubscription.unsubscribe();
      this.overlayCloseSubscription = this.overlayRef
        .outsidePointerEvents()
        .subscribe((event) => {
          const targetEl = <HTMLElement>event.target;
          if (targetEl.closest('.cal-event')) {
            return;
          }
          if (targetEl.closest('.cal-month-cell')) {
            return;
          }
          if (targetEl.closest('.event-backdrop')) {
            return;
          }
          if (targetEl.closest('.event-panel')) {
            return;
          }
          this.overlayRef.detach();
          this.eventId = '';
          return;
        });
    }
  }

  closeOverlay(event: any): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
    }
    if (event) {
      if (event.command === 'delete' && event.data) {
        this.events.some((e, index) => {
          if (e.meta.event_id === event.data.event_id) {
            this.events.splice(index, 1);
            return true;
          }
        });
        this.filterEvents();
      }
    }
  }

  moreView(event: any, origin: any, content: any): void {
    this.overlayService.open(
      origin,
      content,
      this.viewContainerRef,
      'automation',
      {
        data: event
      }
    );
  }

  getWeekStringMode(): string {
    try {
      if (this.weekStart && this.weekEnd) {
        const startYear = this.weekStart.getFullYear();
        const endYear = this.weekEnd.getFullYear();
        const startMonth = this.weekStart.getMonth();
        const endMonth = this.weekEnd.getMonth();
        if (startYear !== endYear) {
          return 'year';
        } else if (startMonth !== endMonth) {
          return 'month';
        }
        return 'day';
      } else {
        return 'day';
      }
    } catch (e) {
      return 'day';
    }
  }

  _convertMine2Standard(event: any) {
    const res = {};
  }

  _convertStandard2Mine(event: any) {
    const res = {
      title: event.title,
      start: new Date(event.due_start),
      end: new Date(event.due_end),
      meta: {
        contacts: event.contacts,
        calendar_id: event.calendar_id,
        description: event.description,
        location: event.location,
        type: event.type,
        guests: event.guests,
        event_id: event.event_id,
        recurrence: event.recurrence,
        recurrence_id: event.recurrence_id,
        is_organizer: event.is_organizer,
        organizer: event.organizer
      }
    };
    return res;
  }
  _convertStandard2Original(event: any) {
    if (event.guests && event.guests.length) {
      const guests = [];
      event.guests.forEach((e) => {
        let guest;
        if (typeof e === 'string') {
          guest = {
            response: 'needsAction',
            email: e
          };
        } else {
          guest = e;
        }
        guests.push(guest);
      });
      event.guests = guests;
    }
    return event;
  }

  getDurationOption(start, end): boolean {
    let startDate, endDate;
    if (typeof start === 'string') {
      startDate = new Date(start);
    } else {
      startDate = start;
    }
    if (typeof end === 'string') {
      endDate = new Date(end);
    } else {
      endDate = end;
    }
    const startHour = startDate.getHours();
    const endHour = endDate.getHours();

    return (
      (startHour >= 12 && endHour >= 12) || (startHour <= 12 && endHour <= 12)
    );
  }
}
