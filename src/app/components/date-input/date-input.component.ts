import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  NgbDateStruct,
  NgbTimeStruct,
  NgbDatepicker
} from '@ng-bootstrap/ng-bootstrap';
import {
  Component,
  Input,
  OnInit,
  Output,
  ViewChild,
  EventEmitter
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { numPad } from 'src/app/helper';

@Component({
  selector: 'app-date-input',
  templateUrl: './date-input.component.html',
  styleUrls: ['./date-input.component.scss']
})
export class DateInputComponent implements OnInit {
  @Input() placeholder = 'Select Date';
  @Input() required = true;
  @Input() clearable = false;
  @Input()
  public set value(val: number) {
    if (val) {
      this.dateObj = {
        day: parseInt(val['day']),
        month: parseInt(val['month']),
        year: parseInt(val['year'])
      };
      this.dateString =
        this.dateObj.month + '-' + this.dateObj.day + '-' + this.dateObj.year;
      if (this.hasTime) {
        this.timeObj.hour = parseInt(val['hour']);
        this.timeObj.minute = parseInt(val['minute']);
        this.timeObj.second = 0;
        this.dateString =
          this.dateObj.year +
          '-' +
          this.dateObj.month +
          '-' +
          this.dateObj.day +
          ' ' +
          (this.timeObj.hour <= 12
            ? numPad(this.timeObj.hour)
            : numPad(this.timeObj.hour % 12)) +
          ':' +
          numPad(this.timeObj.minute) +
          ' ' +
          (this.timeObj.hour < 12 ? 'AM' : 'PM');
      }
    } else {
      this.dateObj = null;
      this.dateString = '';
    }
  }
  @Output() valueChange = new EventEmitter();
  @Input() minDate = null;
  @Input() type = '';
  @Input() uiType = 'default';
  @Input() title = '';
  @Input() hasTime = false;
  @Input('markToday') markToday = false;
  isOpen = false;
  dateInput: FormControl = new FormControl();
  @ViewChild('trigger') triggerElement: CdkOverlayOrigin;
  @ViewChild('dp') dp: NgbDatepicker;

  dateObj: NgbDateStruct;
  timeObj: NgbTimeStruct = {
    hour: 9,
    minute: 0,
    second: 0
  };
  dateString;
  constructor() {}

  ngOnInit(): void {}

  closeOverlay(event: MouseEvent): void {
    const target = <HTMLInputElement>event.target;
    const triggerEl = <HTMLInputElement>(
      this.triggerElement.elementRef.nativeElement
    );
    if (target === triggerEl) {
      return;
    }
    this.isOpen = false;
    return;
  }

  openOverlay(): void {
    this.isOpen = !this.isOpen;
    const triggerEl = <HTMLInputElement>(
      this.triggerElement.elementRef.nativeElement
    );
    triggerEl.blur();
    setTimeout(() => {
      this.dp.focusDate(this.dateObj);
    }, 200);
  }

  changeDate(): void {
    if (this.dateObj) {
      this.dateString =
        this.dateObj.year + '-' + this.dateObj.month + '-' + this.dateObj.day;
    } else {
      this.dateString = '';
    }
    this.valueChange.emit(this.dateObj);
    this.isOpen = false;
  }

  changeDateTime(close: boolean = true): void {
    if (this.dateObj) {
      if (!this.hasTime) {
        this.dateString =
          this.dateObj.year + '-' + this.dateObj.month + '-' + this.dateObj.day;
      } else {
        this.dateString =
          this.dateObj.year +
          '-' +
          this.dateObj.month +
          '-' +
          this.dateObj.day +
          ' ' +
          (this.timeObj.hour <= 12
            ? numPad(this.timeObj.hour)
            : numPad(this.timeObj.hour % 12)) +
          ':' +
          numPad(this.timeObj.minute) +
          ' ' +
          (this.timeObj.hour < 12 ? 'AM' : 'PM');
      }
    } else {
      this.dateString = '';
    }
    this.valueChange.emit({ ...this.dateObj, ...this.timeObj });
    if (close) {
      this.isOpen = false;
    }
  }

  dateFormat(): string {
    if (this.dateObj) {
      if (!this.hasTime) {
        return (
          this.MONTHS[this.dateObj.month - 1] +
          ' ' +
          this.dateObj.day +
          ' ' +
          this.dateObj.year
        );
      } else {
        return (
          this.MONTHS[this.dateObj.month - 1] +
          ' ' +
          this.dateObj.day +
          ' ' +
          this.dateObj.year +
          ' ' +
          (this.timeObj.hour <= 12
            ? numPad(this.timeObj.hour)
            : numPad(this.timeObj.hour % 12)) +
          ':' +
          numPad(this.timeObj.minute) +
          ' ' +
          (this.timeObj.hour < 12 ? 'AM' : 'PM')
        );
      }
    } else {
      return 'Select date';
    }
  }

  clearDate(): void {
    this.dateString = '';
    this.dateObj = null;
    this.valueChange.emit(null);
  }

  MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
}
