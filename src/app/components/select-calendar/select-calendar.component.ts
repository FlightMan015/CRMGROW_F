import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppointmentService } from 'src/app/services/appointment.service';

@Component({
  selector: 'app-select-calendar',
  templateUrl: './select-calendar.component.html',
  styleUrls: ['./select-calendar.component.scss']
})
export class SelectCalendarComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @Input() calendar;
  @Input() selectedCalendar;
  @Output() calendarChange: EventEmitter<any> = new EventEmitter();
  accounts: any[] = [];
  loadSubscription: Subscription;

  calendarControl: FormControl = new FormControl();

  constructor(public appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadSubscription = this.appointmentService.calendars$.subscribe(
      (data) => {
        let defaultCalendar;
        data.forEach((account) => {
          const acc = { email: account.email };
          if (account.data) {
            const calendars = [];
            account.data.forEach((e) => {
              const calendar = { ...e, account: account.email };
              calendars.push(calendar);
              if (this.selectedCalendar) {
                if (calendar.id === this.selectedCalendar.id) {
                  defaultCalendar = calendar;
                }
              }
              if (!defaultCalendar) {
                defaultCalendar = calendar;
              }
            });
            acc['calendars'] = calendars;
            this.accounts.push(acc);
          }
        });
        if (defaultCalendar) {
          setTimeout(() => {
            this.calendarControl.setValue(defaultCalendar);
          }, 10);
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.loadSubscription && this.loadSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {}

  changeCalendar(): void {
    this.calendarChange.emit(this.calendar);
  }
}
