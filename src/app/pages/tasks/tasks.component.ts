import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, concat } from 'rxjs';
import { TaskEditComponent } from 'src/app/components/task-edit/task-edit.component';
import {
  BulkActions,
  DialogSettings,
  STATUS,
  TaskStatus
} from 'src/app/constants/variable.constants';
import { getCurrentTimezone } from 'src/app/helper';
import { TaskSearchOption } from 'src/app/models/searchOption.model';
import { Task, TaskDetail } from 'src/app/models/task.model';
import { ContactService } from 'src/app/services/contact.service';
import { HandlerService } from 'src/app/services/handler.service';
import { StoreService } from 'src/app/services/store.service';
import { TaskService } from 'src/app/services/task.service';
import { UserService } from 'src/app/services/user.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import 'moment-timezone';
import { ConfirmComponent } from '../../components/confirm/confirm.component';
import { TaskDeleteComponent } from '../../components/task-delete/task-delete.component';
import { TaskBulkComponent } from '../../components/task-bulk/task-bulk.component';
import { ActivityService } from '../../services/activity.service';
import { NotifyComponent } from 'src/app/components/notify/notify.component';
import { ToastrService } from 'ngx-toastr';
import { SendEmailComponent } from 'src/app/components/send-email/send-email.component';
import { DialPlanComponent } from 'src/app/components/dial-plan/dial-plan.component';
import { Contact } from 'src/app/models/contact.model';
import { DetailErrorComponent } from 'src/app/components/detail-error/detail-error.component';
import { AppointmentService } from 'src/app/services/appointment.service';
import { CalendarDialogComponent } from 'src/app/components/calendar-dialog/calendar-dialog.component';
import { TaskRecurringDialogComponent } from 'src/app/components/task-recurring-dialog/task-recurring-dialog.component';
import { MatDrawer } from '@angular/material/sidenav';
import { Garbage } from 'src/app/models/garbage.model';
import { TaskSettingComponent } from 'src/app/components/task-setting/task-setting.component';
@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  @ViewChild('drawer') drawer: MatDrawer;
  TASK_STATUS = TaskStatus;
  STATUS = STATUS;
  ACTIONS = BulkActions.Tasks;
  DISPLAY_COLUMNS = [
    'select',
    'status',
    'contact_name',
    'contact_label',
    'subject',
    'contact_phone',
    'deadline',
    'is_recurrence',
    'contact_address',
    'action'
  ];
  TASK_ICONS = {
    task: 'i-task',
    call: 'i-phone',
    meeting: 'i-lunch',
    email: 'i-message',
    material: 'i-video',
    text: 'i-sms-sent'
  };
  DEADLINE_TYPES = [
    { id: 'all', label: 'All tasks' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'this week', label: 'This week' },
    { id: 'next week', label: 'Next week' },
    { id: 'future', label: 'Future' },
    { id: 'custom', label: 'Custom' }
  ];
  PAGE_COUNTS = [
    { id: 8, label: '8' },
    { id: 10, label: '10' },
    { id: 20, label: '20' },
    { id: 50, label: '50' }
  ];
  pageSize = this.PAGE_COUNTS[2];
  // Task Filter Type
  deadline = this.DEADLINE_TYPES[0];
  isUpdating = false;
  updateSubscription: Subscription;
  isLoading = false;
  isPackageDialer = true;

  selecting = false;
  selectSubscription: Subscription;
  selectSource = '';
  page = 1;
  selection = [];
  pageSelection = [];
  pageTasks = [];
  completedTasks = [];
  selectedTasks = [];
  timezone;

  profileSubscription: Subscription;
  loadSubscription: Subscription;

  focusRequired = false;
  opened = false;
  searchOption: TaskSearchOption = new TaskSearchOption();

  garbage: Garbage = new Garbage();

  constructor(
    private handlerService: HandlerService,
    public taskService: TaskService,
    public activityService: ActivityService,
    public storeService: StoreService,
    private contactService: ContactService,
    private userService: UserService,
    private dialog: MatDialog,
    private appointmentService: AppointmentService,
    private toast: ToastrService
  ) {
    this.appointmentService.loadCalendars(false);
    this.profileSubscription && this.profileSubscription.unsubscribe();
    this.profileSubscription = this.userService.profile$.subscribe((user) => {
      this.isPackageDialer = user.dialer_info?.is_enabled || false;
      // try {
      //   this.timezone = JSON.parse(user.time_zone_info);
      // } catch (err) {
      //   const timezone = getCurrentTimezone();
      //   this.timezone = { zone: user.time_zone || timezone };
      // }
      this.timezone = { zone: getCurrentTimezone() };
    });

    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.storeService.tasks$.subscribe((tasks) => {
      if (tasks) {
        this.pageTasks = tasks;
        const ids = tasks.map((e) => e._id);
        this.pageSelection = _.intersection(this.selection, ids);
      }
    });

    this.userService.garbage$.subscribe((res) => {
      this.garbage = new Garbage().deserialize(res);
    });
  }

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    // this.taskService.resetOption();
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.profileSubscription && this.profileSubscription.unsubscribe();
  }

  loadTasks(): void {
    const page = this.taskService.page.getValue();
    const pageSize = this.taskService.pageSize.getValue();
    const durationOption = this.taskService.searchOption.getValue();
    this.changePage(page || 1);
    this.PAGE_COUNTS.some((e) => {
      if (e.id === pageSize) {
        this.pageSize = e;
        return true;
      }
    });

    if (!durationOption.name) {
      durationOption.name = 'all';
      durationOption.deserialize(durationOption);
      this.taskService.searchOption.next(durationOption);
    }

    this.DEADLINE_TYPES.some((e) => {
      if (e.id === durationOption.name) {
        this.deadline = e;
        return true;
      }
    });
  }

  /**
   * Change the Task Deadline
   * @param value : Deadline Type -> {label: '', id: ''}
   */
  changeDeadlineType(value: any): void {
    if (value.id == 'custom') {
      this.openDrawer(true);
      return;
    }
    this.page = 1;
    this.deadline = value;

    const durationOption = new TaskSearchOption();
    durationOption.name = value.id;
    let today;
    let weekDay;
    if (this.timezone.tz_name) {
      today = moment().tz(this.timezone.tz_name).startOf('day');
      weekDay = moment().tz(this.timezone.tz_name).startOf('week');
    } else {
      today = moment().utcOffset(this.timezone.zone).startOf('day');
      weekDay = moment().utcOffset(this.timezone.zone).startOf('week');
    }
    let start_date = '';
    let end_date = '';
    switch (value.id) {
      case 'all':
        break;
      case 'overdue':
        end_date = today.format();
        break;
      case 'today':
        start_date = today.format();
        end_date = today.add('day', 1).format();
        break;
      case 'tomorrow':
        start_date = today.clone().add('day', 1).format();
        end_date = today.clone().add('day', 2).format();
        break;
      case 'this week':
        start_date = weekDay.format();
        end_date = weekDay.add('week', 1).format();
        break;
      case 'next week':
        start_date = weekDay.clone().add('week', 1).format();
        end_date = weekDay.clone().add('week', 2).format();
        break;
      case 'future':
        start_date = weekDay.add('week', 2).format();
        break;
      default:
    }
    durationOption.start_date = start_date;
    durationOption.end_date = end_date;
    durationOption.status = 0;
    this.taskService.page.next(1);
    this.taskService.changeSearchOption(durationOption);

    this.selection = [];
    this.pageSelection = [];
  }

  changePage(page: number): void {
    this.page = page;
    this.taskService.loadPage(page);
    this.storeService.tasks$.subscribe((res) => {
      if (res) {
        this.pageTasks = res;
        this.pageSelection = _.intersectionBy(
          this.selection,
          this.pageTasks,
          '_id'
        );
      }
    });
  }

  onOverPages(page: number): void {
    this.changePage(page);
  }

  changePageSize(size: any): void {
    const newPage =
      Math.floor((this.pageSize.id * (this.page - 1)) / size.id) + 1;

    this.pageSize = size;
    this.taskService.pageSize.next(size.id);
    this.changePage(newPage);
  }
  /**
   * Open Filter Panel
   */
  openFilter(): void {}

  /**
   * Do Action
   * @param action: Action Data (ActionItem | ActionSubItem)
   */
  doAction(action: any): void {
    if (action.command === 'edit') {
      this.editTasks();
    } else if (action.command === 'complete') {
      this.completeTasks();
    } else if (action.command === 'delete') {
      this.deleteTasks();
    } else if (action.command === 'select') {
      this.selectAll(true);
    } else if (action.command === 'deselect') {
      this.deselectAll();
    } else if (action.command === 'email') {
      this.openEmailDlg();
    } else if (action.command === 'call') {
      this.openCallDlg();
    } else if (action.command === 'appointment') {
      this.openAppointmentDlg();
    }
  }

  /**
   * Update the Label of the current contact or selected contacts.
   * @param label : Label to update
   * @param _id : id of contact to update
   */
  updateLabel(label: string, _id: string): void {
    const newLabel = label ? label : null;
    let ids = [];
    this.selection.forEach((e) => {
      ids.push(e.contact._id);
    });
    if (ids.indexOf(_id) === -1) {
      ids = [_id];
    }
    this.isUpdating = true;
    this.updateSubscription && this.updateSubscription.unsubscribe();
    this.updateSubscription = this.contactService
      .bulkUpdate(ids, { label: newLabel }, {})
      .subscribe((status) => {
        this.isUpdating = false;
        if (status) {
          this.handlerService.bulkContactUpdate$(ids, { label: newLabel }, {});
        }
      });
  }

  openEdit(element: TaskDetail): void {
    this.dialog
      .open(TaskEditComponent, {
        ...DialogSettings.TASK,
        data: {
          task: element,
          contact: element.contact._id
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          if (res.status && res.status == 'deleted') {
            this.selection = [];
            this.pageSelection = [];
            this.selectedTasks = [];
          }
          const sortDir = this.taskService.sortOption.getValue();
          this.taskService.sortOption.next(sortDir);
        }
      });
  }

  toggle(task: TaskDetail): void {
    const toggledPageSelection = _.xorBy(
      this.pageSelection,
      [{ _id: task._id, status: task.status }],
      '_id'
    );
    this.pageSelection = toggledPageSelection;

    const toggledSelection = _.xorBy(
      this.selection,
      [{ _id: task._id, status: task.status }],
      '_id'
    );
    this.selection = toggledSelection;

    if (_.findIndex(this.selectedTasks, { _id: task._id }, '_id') == -1) {
      this.selectedTasks.push(task);
    } else {
      const pos = _.findIndex(this.selectedTasks, { _id: task._id }, '_id');
      this.selectedTasks.splice(pos, 1);
    }

    // const pagePosition = this.pageSelection.indexOf(task_id);
    // const pos = this.selection.indexOf(task_id);
    // if (pos !== -1) {
    //   this.selection.splice(pos, 1);
    // } else {
    //   this.selection.push(task_id);
    // }
    // if (pagePosition !== -1) {
    //   this.pageSelection.splice(pagePosition, 1);
    // } else {
    //   this.pageSelection.push(task_id);
    // }
  }

  isSelected(task_id: string): boolean {
    return _.findIndex(this.pageSelection, { _id: task_id }, '_id') !== -1;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection = _.differenceBy(
        this.selection,
        this.pageSelection,
        '_id'
      );
      this.pageSelection = [];
      this.pageTasks.forEach((e) => {
        const pos = _.findIndex(this.selectedTasks, { _id: e._id }, '_id');
        this.selectedTasks.splice(pos, 1);
      });
      return;
    }
    this.pageTasks.forEach((e) => {
      if (!this.isSelected(e._id)) {
        this.pageSelection.push({ _id: e._id, status: e.status });
        this.selection.push({ _id: e._id, status: e.status });
        const pos = _.findIndex(this.selectedTasks, { _id: e._id }, '_id');
        if (pos < 0) {
          this.selectedTasks.push(e);
        }
      }
    });
  }

  isAllSelected(): boolean {
    if (this.selection.length === this.taskService.total.getValue()) {
      this.updateSelectActionStatus(false);
    } else {
      this.updateSelectActionStatus(true);
    }
    return this.pageSelection.length === this.pageTasks.length;
  }

  updateSelectActionStatus(status: boolean): void {
    this.ACTIONS.some((e) => {
      if (e.command === 'select') {
        e.spliter = status;
      }
    });
  }

  /**
   * Select All Tasks
   */
  selectAll(source = false): void {
    if (source) {
      // Update the Actions Header
      for (let i = this.ACTIONS.length - 1; i >= 0; i--) {
        if (this.ACTIONS[i].command === 'select') {
          this.ACTIONS[i]['loading'] = true;
        }
      }
      this.selectSource = 'header';
    } else {
      this.selectSource = 'page';
    }

    this.selecting = true;
    this.selectSubscription && this.selectSubscription.unsubscribe();
    this.selectSubscription = this.taskService
      .selectAll()
      .subscribe((tasks) => {
        this.selecting = false;
        this.selection = tasks;
        this.selectedTasks = tasks;
        this.pageSelection = this.pageTasks.map((e) => ({
          _id: e._id,
          status: e.status
        }));
        for (let i = this.ACTIONS.length - 1; i >= 0; i--) {
          if (this.ACTIONS[i].command === 'select') {
            this.ACTIONS[i]['loading'] = false;
          }
        }
        this.updateSelectActionStatus(false);
      });
  }

  deselectAll(): void {
    this.pageSelection = [];
    this.selection = [];
    this.selectedTasks = [];
    this.updateSelectActionStatus(true);
  }

  changeSort(): void {
    this.taskService.page.next(1);
    const sortDir = this.taskService.sortOption.getValue();
    this.taskService.sortOption.next(sortDir * -1);
  }

  taskComplete(task: TaskDetail): void {
    if (task.status == 1) {
      this.dialog.open(NotifyComponent, {
        width: '98vw',
        maxWidth: '390px',
        data: {
          title: 'Complete Task',
          message: 'This task is completed already.'
        }
      });
      return;
    }
    this.taskService.complete(task._id).subscribe((res) => {
      if (res && res['status']) {
        this.handlerService.updateTasks$([task._id], {
          status: 1
        });
        // const searchOption = this.taskService.searchOption.getValue();
        // if (searchOption.status === 0) {
        //   this.completedTasks.push(task._id);
        //   setTimeout(() => {
        //     const pos = this.completedTasks.indexOf(task._id);
        //     if (pos !== -1) {
        //       this.completedTasks.splice(pos, 1);
        //     }
        //     this.taskService.removeTask$([task._id], this.pageSize.id);
        //   }, 1000);
        // }
        this.selection = [];
        this.pageSelection = [];
        this.selectedTasks = [];
        this.handlerService.reload$('tasks');
      }
    });
    // const dialog = this.dialog.open(ConfirmComponent, {
    //   width: '98vw',
    //   maxWidth: '390px',
    //   data: {
    //     title: 'Complete task',
    //     message: 'Are you sure to complete this task?',
    //     confirmLabel: 'Complete'
    //   }
    // });
    // dialog.afterClosed().subscribe((answer) => {
    //   if (answer) {}
    // });
  }

  deleteTasks(): void {
    const selected = this.selection.map((e) => e._id);
    if (selected.length === 1 && this.selection[0].set_recurrence) {
      this.dialog
        .open(TaskRecurringDialogComponent, {
          disableClose: true,
          data: {
            title: 'Delete the recurring task.'
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (!res) {
            return;
          }
          const include_recurrence = res.type == 'all';

          this.taskService
            .archive(this.selection, include_recurrence)
            .subscribe((status) => {
              if (status) {
                this.selection = [];
                this.pageSelection = [];
                this.selectedTasks = [];
                this.handlerService.reload$('tasks');
              }
            });
        });
    } else if (selected.length) {
      const dialog = this.dialog.open(TaskDeleteComponent, {
        data: {
          follow_ups: this.selection
        }
      });

      dialog.afterClosed().subscribe((res) => {
        if (res && res.status) {
          this.selection = [];
          this.pageSelection = [];
          this.selectedTasks = [];
          this.handlerService.reload$('tasks');
        }
      });
    }
  }

  completeTasks(): void {
    const selected = [];
    this.selection.forEach((e) => {
      if (e.status !== 1) {
        selected.push(e._id);
      }
    });
    if (selected.length) {
      const dialog = this.dialog.open(ConfirmComponent, {
        data: {
          title: 'Complete tasks',
          message: 'Are you sure to complete selected task(s)?',
          confirmLabel: 'Complete'
        }
      });
      dialog.afterClosed().subscribe((answer) => {
        if (answer) {
          this.taskService.bulkComplete(this.selectedTasks).subscribe((res) => {
            this.handlerService.updateTasks$(selected, { status: 1 });
            this.selection = [];
            this.pageSelection = [];
            this.selectedTasks = [];
            this.handlerService.reload$('tasks');
            // this.toast.success(
            //   '',
            //   'Selected tasks are completed successfully.',
            //   { closeButton: true }
            // );
            // const searchOption = this.taskService.searchOption.getValue();
            // if (searchOption.status === 0) {
            //   this.completedTasks = [...this.completedTasks, ...selected];
            //   setTimeout(() => {
            //     this.completedTasks = _.difference(
            //       this.completedTasks,
            //       selected
            //     );
            //     this.taskService.removeTask$(selected, this.pageSize.id);
            //     this.deselectAll();
            //   }, 1000);
            // }
          });
        }
      });
    } else {
      // TODO: Show the Alert
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          message: 'Selected Tasks are completed already!',
          label: 'OK'
        }
      });
    }
  }

  editTasks(): void {
    const selected = [];
    this.selection.forEach((e) => {
      if (e.status !== 1) {
        selected.push(e._id);
      }
    });
    if (selected.length > 1) {
      this.dialog
        .open(TaskBulkComponent, {
          width: '100vw',
          maxWidth: '450px',
          data: {
            ids: selected
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const updateData = this.selectedTasks.map((e) => {
              if (res.type) {
                e.type = res.type;
              }
              if (res.content) {
                e.content = res.content;
              }
              if (res.due_date) {
                e.due_date = res.due_date;
              }
              return e;
            });

            this.taskService.bulkUpdate(updateData).subscribe((status) => {
              if (status) {
                const sortDir = this.taskService.sortOption.getValue();
                this.taskService.sortOption.next(sortDir);
                this.taskService.reload();
              }
            });
          }
        });
    } else if (selected.length == 1) {
      // TODO: load the event from id
      this.openEdit(this.selectedTasks[0]);
    } else {
      this.dialog.open(NotifyComponent, {
        ...DialogSettings.ALERT,
        data: {
          message:
            'Selected tasks could not be updated because they are completed already',
          label: 'OK'
        }
      });
    }
  }

  openEmailDlg(): void {
    const selected = [];
    this.selectedTasks.forEach((e) => {
      const index = selected.findIndex((item) => item._id === e.contact._id);
      if (index < 0) {
        selected.push(e.contact);
      }
    });
    this.updateSelectActionStatus(true);
    this.dialog.open(SendEmailComponent, {
      position: {
        bottom: '0px',
        right: '0px'
      },
      width: '100vw',
      panelClass: 'send-email',
      backdropClass: 'cdk-send-email',
      disableClose: false,
      data: {
        contacts: selected
      }
    });
  }

  openCallDlg(): void {
    const contacts = [];
    this.selectedTasks.forEach((e) => {
      const contactObj = new Contact().deserialize(e.contact);
      const contact = {
        contactId: contactObj._id,
        numbers: [contactObj.cell_phone],
        name: contactObj.fullName
      };
      const index = contacts.findIndex(
        (item) => item.contactId === contact.contactId
      );
      if (index < 0) {
        contacts.push(contact);
      }
    });
    this.handlerService.callCommand.next({
      contacts,
      type: 'bulk'
    });
  }

  openAppointmentDlg(): void {
    const calendars = this.appointmentService.calendars.getValue();
    if (!calendars || !calendars.length) {
      this.dialog.open(DetailErrorComponent, {
        width: '98vw',
        maxWidth: '420px',
        data: {
          errorCode: 407
        }
      });
      return;
    }

    const contacts = [];
    if (this.selectedTasks.length == 1) {
      const contactObj = new Contact().deserialize(
        this.selectedTasks[0].contact
      );
      const contact = {
        _id: contactObj._id,
        first_name: contactObj.first_name,
        last_name: contactObj.last_name,
        email: contactObj.email,
        cell_phone: [contactObj.cell_phone]
      };

      if (!contact.email) {
        this.toast.error(
          `This contact doesn't have a email.`,
          `Can't create the new appointment`
        );
        return;
      } else {
        this.dialog.open(CalendarDialogComponent, {
          width: '100vw',
          maxWidth: '600px',
          maxHeight: '700px',
          data: {
            contacts: [contact]
          }
        });
      }
    } else {
      this.selectedTasks.forEach((e) => {
        const contactObj = new Contact().deserialize(e.contact);
        const index = contacts.findIndex((item) => item._id === contactObj._id);
        if (index < 0 && contactObj.email) {
          contacts.push(contactObj);
        }
      });

      this.dialog.open(CalendarDialogComponent, {
        width: '100vw',
        maxWidth: '600px',
        maxHeight: '700px',
        data: {
          contacts: contacts
        }
      });
    }
  }

  openDrawer(focus) {
    this.focusRequired = focus;
    this.opened = true;
  }

  closeDrawer(): void {
    this.searchOption = this.taskService.searchOption.getValue();
    if (!this.searchOption.name) {
      this.deadline = { id: 'all', label: 'All tasks' };
    } else if (this.searchOption.name === 'custom') {
      this.deadline = { id: 'custom', label: 'Custom' };
    }
    this.focusRequired = false;
    this.opened = false;
  }

  customFiltered(): void {
    this.selection = [];
    this.pageSelection = [];
    this.selectedTasks = [];
  }

  openTaskSettingDlg(): void {
    this.dialog
      .open(TaskSettingComponent, {
        width: '100vw',
        maxWidth: '360px',
        maxHeight: '500px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          // console.log(res);
          // this.toast.success('Setting is updated successfully.');
        }
      });
  }
}
