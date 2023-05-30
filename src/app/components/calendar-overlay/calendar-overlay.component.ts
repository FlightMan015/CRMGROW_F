import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {
  TIMES,
  CALENDAR_DURATION,
  RECURRING_TYPE
} from 'src/app/constants/variable.constants';
import { OverlayService } from 'src/app/services/overlay.service';
import { AppointmentService } from 'src/app/services/appointment.service';
import { ToastrService } from 'ngx-toastr';
import { Contact } from 'src/app/models/contact.model';
import * as moment from 'moment';
import { IntegrationService } from 'src/app/services/integration.service';
import { UserService } from 'src/app/services/user.service';
import { numPad } from 'src/app/helper';
interface Event {
  title: string;
  due_start: string;
  due_end: string;
  guests: any[];
  contacts: any[];
  calendar_id: string;
  location: string;
  description: string;
  event_id: string;
  recurrence: string;
  recurrence_id: string;
  remove_contacts: any;
  is_organizer: boolean;
  appointment: string;
  organizer: string;
  timezone: any;
}
@Component({
  selector: 'app-calendar-overlay',
  templateUrl: './calendar-overlay.component.html',
  styleUrls: ['./calendar-overlay.component.scss']
})
export class CalendarOverlayComponent implements OnInit {
  calendar;
  @Input('start_date') start_date: Date;
  @Input('user_email') user_email = '';
  @Input('type') type = '';
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onCreate: EventEmitter<any> = new EventEmitter();
  submitted = false;
  due_time = '12:00:00.000';
  selectedDateTime = {
    year: '',
    month: '',
    day: ''
  };
  event: Event = {
    title: '',
    due_start: '',
    due_end: '',
    guests: [],
    contacts: [],
    calendar_id: '',
    location: '',
    description: '',
    event_id: '',
    recurrence: '',
    recurrence_id: '',
    remove_contacts: [],
    is_organizer: false,
    appointment: '',
    organizer: '',
    timezone: moment.tz.guess()
  };
  duration = 0.5;
  contacts: Contact[] = [];
  isRepeat = false;
  isLoading = false;
  isUser = false;
  times = TIMES;
  calendar_durations = CALENDAR_DURATION;
  recurrings = RECURRING_TYPE;
  zoomCreating = false;
  zoomEnableAccount = [
    'super@crmgrow.com',
    'matt@crmgrow.com',
    'huyam@crmgrow.com'
  ];

  constructor(
    private toast: ToastrService,
    private appointmentService: AppointmentService,
    private overlayService: OverlayService,
    private integrationService: IntegrationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    if (this.start_date) {
      this.selectedDateTime.year = this.start_date.getFullYear().toString();
      this.selectedDateTime.month = (this.start_date.getMonth() + 1).toString();
      this.selectedDateTime.day = this.start_date.getDate().toString();
      if (this.type != 'month') {
        let hour: string, minute: string;
        if (this.start_date.getHours().toString().length == 1) {
          hour = `0${this.start_date.getHours()}`;
        } else {
          hour = this.start_date.getHours().toString();
        }
        if (this.start_date.getMinutes().toString().length == 1) {
          minute = `0${this.start_date.getMinutes().toString()}`;
        } else {
          minute = this.start_date.getMinutes().toString();
        }
        this.due_time = `${hour}:${minute}:00.000`;
      }
    }
  }

  create(): void {
    if (!this.calendar) {
      return;
    }
    // Should select the timezone
    if (!this.event.timezone) {
      return;
    }
    // Due date setting
    const dateString =
      this.selectedDateTime.year +
      '-' +
      numPad(this.selectedDateTime.month) +
      '-' +
      numPad(this.selectedDateTime.day) +
      ' ' +
      this.due_time;
    const due_start = moment.tz(dateString, this.event.timezone).format();
    const due_end = moment
      .tz(due_start, this.event.timezone)
      .add(this.duration * 60, 'minutes')
      .format();
    this.event.due_start = due_start;
    this.event.due_end = due_end;

    let responseTime = {}; // this would be used in handler for outlook event creation
    const connected_email = this.calendar.account;
    const calendar_id = this.calendar.id;

    // Time string change for the outlook case
    const profile = this.userService.profile.getValue();
    const calendar_list = profile.calendar_list;
    const calendar = calendar_list.find(
      (e) => e.connected_email === connected_email
    );
    if (calendar.connected_calendar_type === 'outlook') {
      const timezone = moment.tz(dateString, this.event.timezone).format('Z');
      this.event.due_start = due_start.replace(timezone, '');
      this.event.due_end = due_end.replace(timezone, '');
      responseTime = {
        due_start,
        due_end
      };
    }

    if (this.contacts.length > 0) {
      this.contacts.forEach((contact) => {
        if (contact._id) {
          const data = {
            email: contact.email,
            _id: contact._id
          };
          this.event.contacts.push(data);
        }
        this.event.guests.push(contact.email);
      });
    }
    const data = {
      ...this.event,
      connected_email,
      calendar_id
    };
    this.appointmentService.createEvents(data).subscribe(
      (res) => {
        if (res['status'] == true) {
          this.isLoading = false;
          // this.toast.success('New Event is created successfully');
          this.onCreate.emit({
            ...data,
            event_id: res['event_id'],
            organizer: connected_email,
            is_organizer: true,
            ...responseTime
          });
          this.close();
        }
      },
      (error) => {
        this.isLoading = false;
      }
    );
  }

  createZoomLink(): void {
    this.zoomCreating = true;
    const date = moment(
      this.selectedDateTime.year +
        '-' +
        this.selectedDateTime.month +
        '-' +
        this.selectedDateTime.day +
        ' ' +
        this.due_time
    ).format();
    const data = {
      topic: this.event.title,
      start_time: date,
      type: 2,
      agenda: this.event.description,
      duration: this.duration * 60
    };
    this.integrationService.createZoom(data).subscribe((res) => {
      if (res) {
        this.zoomCreating = false;
        this.event.location = res;
      }
    });
  }

  overlayClose(): void {
    this.overlayService.close(null);
  }

  handleAddressChange(evt: any): void {
    this.event.location = evt.formatted_address;
  }

  setRepeatEvent(): void {
    this.isRepeat = !this.isRepeat;
  }

  close(): void {
    this.onClose.emit();
  }

  /**
   * Chagne the timezone of the string
   * @param $event
   */
  selectTimezone($event): void {
    try {
      this.event.timezone = $event?.tz_name;
    } catch (err) {
      this.event.timezone = moment.tz.guess();
    }
  }
}
