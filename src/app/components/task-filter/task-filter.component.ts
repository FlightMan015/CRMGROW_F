import { SelectionModel } from '@angular/cdk/collections';
import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { TaskStatus, TIMES } from 'src/app/constants/variable.constants';
import {
  convertTimetoObj,
  convertTimetoTz,
  getCurrentTimezone
} from 'src/app/helper';
import { Contact } from 'src/app/models/contact.model';
import { TaskSearchOption } from 'src/app/models/searchOption.model';
import { LabelService } from 'src/app/services/label.service';
import { UserService } from 'src/app/services/user.service';
import { TabOption } from 'src/app/utils/data.types';
import * as moment from 'moment';
import 'moment-timezone';
import { TaskService } from 'src/app/services/task.service';

@Component({
  selector: 'app-task-filter',
  templateUrl: './task-filter.component.html',
  styleUrls: ['./task-filter.component.scss']
})
export class TaskFilterComponent implements OnInit {
  @ViewChild('dateRef') dateRef: ElementRef;
  STATUS_OPTIONS: TabOption[] = [
    { label: 'TO DO', value: TaskStatus.TODO },
    { label: 'ALL', value: TaskStatus.ALL },
    { label: 'COMPLETED', value: TaskStatus.COMPLETED }
  ];
  TIMES = TIMES;
  timezone = { zone: getCurrentTimezone() };

  search = '';
  types = [];
  status = this.STATUS_OPTIONS[1];
  selectedLabels = new SelectionModel<string>(true, []);
  contact: string;
  startDate;
  startTime = '00:00:00.000';
  endDate;
  endTime = '23:30:00.000';
  loading = false;
  showStartDate = true;
  showEndDate = true;
  selectedContact;

  @Input() set isFocus(value: boolean) {
    if (value) {
      setTimeout(() => {
        this.dateRef.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'end',
          inline: 'start'
        });
      }, 500);
    }
  }
  @Output() onClose = new EventEmitter();
  @Output() onFiltered = new EventEmitter();

  constructor(
    public labelService: LabelService,
    private userService: UserService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    // this.userService.profile$.subscribe((user) => {
    //   try {
    //     this.timezone = JSON.parse(user.time_zone_info);
    //   } catch (err) {
    //     const timezone = getCurrentTimezone();
    //     this.timezone = { zone: user.time_zone || timezone };
    //   }
    // });
    const option = this.taskService.searchOption.getValue();
    switch (option.status) {
      case 0:
        this.status = this.STATUS_OPTIONS[0];
        break;
      case 1:
        this.status = this.STATUS_OPTIONS[2];
        break;
      default:
        this.status = this.STATUS_OPTIONS[1];
    }

    if (option.name === 'all') {
      this.showStartDate = false;
      this.showEndDate = false;
    }

    if (option.labels) {
      this.selectedLabels.select(...option.labels);
    }
    if (option.types) {
      this.types = option.types;
    }
    this.selectedContact = option?.contact;
    this.search = option?.str;

    if (option.start_date && moment(option.start_date).isValid()) {
      this.showStartDate = true;
      const timeObj1 = convertTimetoObj(option.start_date, this.timezone);
      this.startDate = { ...timeObj1, time: undefined };
      this.startTime = timeObj1.time;
    } else {
      this.showStartDate = false;
      this.startDate = null;
      this.startTime = null;
    }

    if (option.end_date && moment(option.end_date).isValid()) {
      const timeObj2 = convertTimetoObj(option.end_date, this.timezone);
      this.endDate = { ...timeObj2, time: undefined };
      this.endTime = timeObj2.time;
      this.showEndDate = true;
    } else {
      this.showEndDate = false;
      this.endTime = null;
      this.showEndDate = null;
    }
  }

  toggleTypes(type: string): void {
    const pos = this.types.indexOf(type);
    if (pos !== -1) {
      this.types.splice(pos, 1);
    } else {
      this.types.push(type);
    }
    this.applyFilters();
  }

  selectContact(event: Contact): void {
    if (event && event._id) {
      this.contact = event._id;
    } else {
      this.contact = null;
    }
    this.applyFilters();
  }

  changeTime(type: string): void {
    if (type === 'start') {
      if (this.startDate) {
        this.changeDate(type);
      }
    } else {
      if (this.endDate) {
        this.changeDate(type);
      }
    }
  }

  /**
   * Apply Filter to the Task List
   */
  applyFilters(): void {
    const searchOption = new TaskSearchOption();
    searchOption.name = 'custom';
    searchOption.str = this.search;
    let status;
    if (this.status.value === TaskStatus.TODO) {
      status = 0;
    } else if (this.status.value == TaskStatus.COMPLETED) {
      status = 1;
    }
    searchOption.status = status;
    searchOption.contact = this.contact;
    searchOption.types = this.types;
    searchOption.labels = this.selectedLabels.selected;

    // Timezone
    if (this.startDate) {
      const start_date = convertTimetoTz(
        this.startDate,
        this.startTime,
        this.timezone
      );
      searchOption.start_date = start_date;
    }
    if (this.endDate) {
      const end_date = convertTimetoTz(
        this.endDate,
        this.endTime,
        this.timezone
      );
      searchOption.end_date = end_date;
    }

    if (!this.showStartDate) {
      searchOption.start_date = undefined;
    }
    if (!this.showEndDate) {
      searchOption.end_date = undefined;
    }

    this.taskService.changeSearchOption(searchOption);
    this.onFiltered.emit();
  }

  clearLabels(): void {
    this.selectedLabels.clear();
    const currentSearchOption = this.taskService.searchOption.getValue();
    currentSearchOption.labels = [];
    this.taskService.changeSearchOption(currentSearchOption);
  }

  clearFilter(): void {
    this.types = [];
    this.search = '';
    this.status = this.STATUS_OPTIONS[0];
    this.selectedLabels.clear();
    this.contact = null;
    this.selectedContact = null;
    this.taskService.clearSearchOption();
  }

  close(): void {
    this.onClose.emit();
  }

  toggleDateInput(checked, type): void {
    let timeObj = convertTimetoObj(
      moment().startOf('day').format(),
      this.timezone
    );
    if (type === 'start') {
      if (checked && this.showEndDate) {
        const end_date = convertTimetoTz(
          this.endDate,
          this.endTime,
          this.timezone
        );
        timeObj = convertTimetoObj(
          moment(end_date).subtract(1, 'days').startOf('day').format(),
          this.timezone
        );
      }

      this.showStartDate = checked;
      this.startDate = checked ? { ...timeObj, time: undefined } : null;
      this.startTime = checked ? timeObj.time : null;
    } else {
      if (checked && this.showStartDate) {
        const start_date = convertTimetoTz(
          this.startDate,
          this.startTime,
          this.timezone
        );
        timeObj = convertTimetoObj(
          moment(start_date).add(1, 'days').startOf('day').format(),
          this.timezone
        );
      }
      this.showEndDate = checked;
      this.endDate = checked ? { ...timeObj, time: undefined } : null;
      this.endTime = checked ? timeObj.time : null;
    }
    this.applyFilters();
  }

  changeDate(type: string): void {
    let start_date = convertTimetoTz(
      this.startDate,
      this.startTime,
      this.timezone
    );
    let end_date = convertTimetoTz(this.endDate, this.endTime, this.timezone);

    if (
      start_date &&
      end_date &&
      moment(start_date).isAfter(moment(end_date))
    ) {
      if (type === 'start') {
        end_date = moment(start_date).clone().add(1, 'day').format();
      } else {
        start_date = moment(end_date).clone().subtract(1, 'day').format();
      }
    }

    const timeObj1 = convertTimetoObj(start_date, this.timezone);
    this.startDate = { ...timeObj1, time: undefined };
    this.startTime = timeObj1.time;

    const timeObj2 = convertTimetoObj(end_date, this.timezone);
    this.endDate = { ...timeObj2, time: undefined };
    this.endTime = timeObj2.time;
    this.applyFilters();
  }
}
