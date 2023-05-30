import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SCHEDULE } from '../constants/api.constant';
import { STATUS } from '../constants/variable.constants';
import { ErrorService } from './error.service';
import { HttpService } from './http.service';
import { EventType } from '../models/eventType.model';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService extends HttpService {
  constructor(errorService: ErrorService, private httpClient: HttpClient) {
    super(errorService);
  }

  eventTypes: BehaviorSubject<EventType[]> = new BehaviorSubject([]);
  eventTypes$ = this.eventTypes.asObservable();
  loadStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadStatus$ = this.loadStatus.asObservable();

  // pagination
  pageSize: BehaviorSubject<number> = new BehaviorSubject(50);
  pageSize$ = this.pageSize.asObservable();
  page: BehaviorSubject<any> = new BehaviorSubject(1);
  page$ = this.page.asObservable();
  pageEvents: BehaviorSubject<Array<any>> = new BehaviorSubject([]);
  pageEvents$ = this.pageEvents.asObservable();
  total: BehaviorSubject<number> = new BehaviorSubject(0);
  total$ = this.total.asObservable();
  loadEventsStatus: BehaviorSubject<string> = new BehaviorSubject(STATUS.NONE);
  loadingEvents$ = this.loadEventsStatus.asObservable();

  loadSubscription1: Subscription;
  loadSubscription2: Subscription;
  loadSubscription3: Subscription;
  eventType: BehaviorSubject<EventType> = new BehaviorSubject(new EventType());
  eventType$ = this.eventType.asObservable();
  loadCalendarStatus: BehaviorSubject<string> = new BehaviorSubject(
    STATUS.NONE
  );
  loadCalendarStatus$ = this.loadCalendarStatus.asObservable();

  calendarEvents: BehaviorSubject<any> = new BehaviorSubject({});
  calendarEvents$ = this.calendarEvents.asObservable();

  getEventTypes(force = false): void {
    if (!force) {
      const loadStatus = this.loadStatus.getValue();
      if (loadStatus != STATUS.NONE && loadStatus != STATUS.FAILURE) {
        return;
      }
    }
    this.loadStatus.next(STATUS.REQUEST);
    this.getEventTypesImpl().subscribe((eventTypes) => {
      eventTypes
        ? this.loadStatus.next(STATUS.SUCCESS)
        : this.loadStatus.next(STATUS.FAILURE);
      this.eventTypes.next(eventTypes || []);
    });
  }

  getEventTypesImpl(): Observable<EventType[]> {
    return this.httpClient.get(this.server + SCHEDULE.EVENT_TYPE).pipe(
      map((res) =>
        (res['data'] || []).map((e) => new EventType().deserialize(e))
      ),
      catchError(this.handleError('SCHEDULE EVENT TYPE GET ALL', null))
    );
  }

  getEventType(id: string): Observable<EventType> {
    return this.httpClient.get(this.server + SCHEDULE.EVENT_TYPE + id).pipe(
      map((res) =>
        res['data'] ? new EventType().deserialize(res['data']) : null
      ),
      catchError(this.handleError('SCHEDULE EVENT TYPE UPDATE', null))
    );
  }

  createEventType(data: any): Observable<any> {
    return this.httpClient.post(this.server + SCHEDULE.EVENT_TYPE, data).pipe(
      map((res) => res['data']),
      catchError(this.handleError('SCHEDULE EVENT TYPE CREATE', null))
    );
  }

  updateEventType(id: string, data: any): Observable<boolean> {
    return this.httpClient
      .put(this.server + SCHEDULE.EVENT_TYPE + id, data)
      .pipe(
        map((res) => res['status']),
        catchError(this.handleError('SCHEDULE EVENT TYPE UPDATE', false))
      );
  }

  deleteEventType(id: string): Observable<boolean> {
    return this.httpClient.delete(this.server + SCHEDULE.EVENT_TYPE + id).pipe(
      map((res) => res['status']),
      catchError(this.handleError('SCHEDULE EVENT TYPE DELETE', false))
    );
  }

  getEventTypeByLink(data: any): Observable<boolean> {
    return this.httpClient
      .post(this.server + SCHEDULE.SEARCH_BY_LINK, data)
      .pipe(
        map((res) => res['data']),
        catchError(this.handleError('SCHEDULE EVENT TYPE GET BY LINK', false))
      );
  }

  getAllEvents(data): Observable<any> {
    this.loadEventsStatus.next(STATUS.REQUEST);
    return this.httpClient.post(this.server + SCHEDULE.GET_EVENT, data).pipe(
      map((res) => {
        if (res['status'] && Array.isArray(res['data'])) {
          const result = [];
          for (const schedule of res['data']) {
            const day = moment(schedule.due_start).format('YYYY-MM-DD');
            if (day in result) {
              result[day].push(schedule);
            } else {
              result[day] = [schedule];
            }
          }
          this.pageEvents.next(result);
          this.total.next(res['total']);
        }
        res['status']
          ? this.loadEventsStatus.next(STATUS.SUCCESS)
          : this.loadEventsStatus.next(STATUS.FAILURE);
        // return result;
      }),
      catchError(this.handleError('LOAD SCHEDULED EVENTS', null))
    );
  }

  addSchedulerEvent(data: any): Observable<EventType> {
    return this.httpClient.post(this.server + SCHEDULE.ADD_SCHEDULE, data).pipe(
      map((res) => res['status']),
      catchError(this.handleError('SCHEDULER EVENT ADD', null))
    );
  }

  loadConflicts(monthStart, user_id): any {
    const event_type = this.eventType.getValue();
    return this.httpClient
      .post(this.server + SCHEDULE.LOAD_CONFLICTS, {
        date: monthStart,
        user_id
        // user_id: event_type.user['_id']
      })
      .pipe(
        map((res) => {
          let result = [];
          res['data'].forEach((emailCalendar) => {
            if (emailCalendar.status && emailCalendar.calendar.data) {
              const calendars = emailCalendar.calendar.data;
              calendars.forEach((calendar) => {
                if (calendar.items) result = result.concat(calendar.items);
              });
            }
          });
          return result;
        }),
        catchError(this.handleError('LOAD CONFLICTS'))
      );
  }

  loadCalendar(monthStart, event_type, user_id): void {
    this.loadCalendarStatus.next(STATUS.REQUEST);
    // const event_type = this.eventType.getValue();
    const data = {
      // user_id: event_type.user['_id'],
      user_id,
      searchOption: {}
    };

    const currentMonthStart = moment(monthStart).startOf('month').format();

    const prevMonthStart = moment(monthStart)
      .subtract(1, 'month')
      .startOf('month')
      .format();
    const nextMonthStart = moment(monthStart)
      .add(1, 'month')
      .startOf('month')
      .format();

    this.loadSubscription1 && this.loadSubscription1.unsubscribe();
    this.loadSubscription1 = this.loadConflicts(monthStart, user_id).subscribe(
      (res) => {
        if (event_type.type == 1) {
          this.addEvents(currentMonthStart, res);

          res
            ? this.loadCalendarStatus.next(STATUS.SUCCESS)
            : this.loadCalendarStatus.next(STATUS.FAILURE);
        } else {
          data.searchOption = {
            event_type: [event_type._id],
            due_start: monthStart.format(),
            due_end: moment(monthStart).clone().add(1, 'month').format()
          };
          this.loadBookedEvents(data).subscribe((events) => {
            const result = res.filter(
              (ele) =>
                !events.some((event) =>
                  moment(event.due_start).isSame(moment(ele.due_start))
                )
            );
            this.addEvents(currentMonthStart, result);
            events
              ? this.loadCalendarStatus.next(STATUS.SUCCESS)
              : this.loadCalendarStatus.next(STATUS.FAILURE);
          });
        }
      }
    );

    this.loadSubscription2 && this.loadSubscription2.unsubscribe();
    this.loadSubscription2 = this.loadConflicts(
      prevMonthStart,
      user_id
    ).subscribe((res) => {
      if (event_type.type == 1) {
        this.addEvents(prevMonthStart, res);
      } else {
        data.searchOption = {
          event_type: [event_type._id],
          due_start: prevMonthStart,
          due_end: moment(prevMonthStart).clone().add(1, 'month').format()
        };

        this.loadBookedEvents(data).subscribe((events) => {
          this.addEvents(
            prevMonthStart,
            res.filter(
              (ele) =>
                !events.some((event) =>
                  moment(event.due_start).isSame(moment(ele.due_start))
                )
            )
          );
        });
      }
    });

    this.loadSubscription3 && this.loadSubscription3.unsubscribe();
    this.loadSubscription3 = this.loadConflicts(
      nextMonthStart,
      user_id
    ).subscribe((res) => {
      if (event_type.type == 1) {
        this.addEvents(nextMonthStart, res);
      } else {
        data.searchOption = {
          event_type: [event_type._id],
          due_start: nextMonthStart,
          due_end: moment(nextMonthStart).clone().add(1, 'month').format()
        };

        this.loadBookedEvents(data).subscribe((events) => {
          this.addEvents(
            nextMonthStart,
            res.filter(
              (ele) =>
                !events.some((event) =>
                  moment(event.due_start).isSame(moment(ele.due_start))
                )
            )
          );
        });
      }
    });
  }

  loadBookedEvents(data) {
    return this.httpClient.post(this.server + SCHEDULE.GET_EVENT, data).pipe(
      map((res) => {
        if (res['status'] && Array.isArray(res['data'])) {
          return res['data'];
        }
        return [];
      }),
      catchError(this.handleError('LOAD SCHEDULED EVENTS', null))
    );
  }

  addEvents(date, data) {
    const calendarEvents = this.calendarEvents.getValue();
    const days = Object.keys(calendarEvents);
    if (days.length >= 20) {
      days.sort((a, b) => (moment(a).isAfter(moment(b)) ? 1 : -1));
      delete calendarEvents[days[0]];
    }
    const key = moment(date).format('YYYY-MM-DD');
    calendarEvents[key] = data;
    this.calendarEvents.next(calendarEvents);
  }
}
