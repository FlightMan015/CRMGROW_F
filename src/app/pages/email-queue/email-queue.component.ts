import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from 'src/app/services/notification.service';
import * as _ from 'lodash';
import { CampContact, Contact } from 'src/app/models/contact.model';
import { Template } from 'src/app/models/template.model';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { ScheduleSettingComponent } from 'src/app/components/schedule-setting/schedule-setting.component';
import { HandlerService } from 'src/app/services/handler.service';

@Component({
  selector: 'app-email-queue',
  templateUrl: './email-queue.component.html',
  styleUrls: ['./email-queue.component.scss']
})
export class EmailQueueComponent implements OnInit, OnDestroy {
  queue_id: string = '';
  template: any;
  loading: boolean = false;

  currentPanel = 'all';

  STATUS = {
    draft: 'Paused',
    pausing: 'Paused',
    awaiting: 'Awaiting',
    progressing: 'Processing'
  };

  contacts = {
    all: {
      title: 'Assigned contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    sent: {
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    awaiting: {
      title: 'Awaiting contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    delivered: {
      title: 'Delivered contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    failed: {
      title: 'Failed Contacts',
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    notExecuted: {
      data: [],
      loading: false,
      page: 1,
      pageSize: 15
    },
    task: {
      title: '',
      _id: '',
      data: [],
      loading: false,
      page: 1,
      pageSize: 100
    }
  };
  status = {
    all: 0,
    sent: 0,
    awaiting: 0,
    delivered: 0,
    failed: 0,
    notExecuted: 0
  };

  DISPLAY_COLUMNS = [
    'contact_name',
    'contact_label',
    'last_activity',
    'contact_email',
    'status',
    'action'
  ];

  loadSubscription: Subscription;
  loadDataSubscription: Subscription;
  removeSubscription: Subscription;
  routeChangeSubscription: Subscription;

  showFullTemplate: boolean = false;
  isAbleEdit: boolean = false;
  isEditing: boolean = false;

  queueType: string = 'email';
  detailType: string = ''; // 'bulk emailing' | 'schedule' | 'recurring'
  nextTime = null;
  execStatus = ''; // task current status : 'awaiting' | 'progressing'
  recurrenceMode = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private dialog: MatDialog,
    private handlerService: HandlerService
  ) {}

  ngOnInit(): void {
    if (this.router.url.startsWith('/email-queue')) {
      this.queueType = 'email';
    } else {
      this.queueType = 'text';
    }

    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      this.queue_id = params['id'];
      this.loadQueue();
    });
  }

  ngOnDestroy(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  /**
   * Load Queue Email Contents and Materials and Sessions
   */
  loadQueue(): void {
    this.template = new Template();
    // data format
    // status format
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loading = true;
    this.loadSubscription = this.notificationService
      .getEmailQueue({
        id: this.queue_id,
        limit: 20,
        page: 1,
        mode: 'init'
      })
      .subscribe((res) => {
        this.loading = false;
        if (res?.status) {
          this.template = res.data?.status?.action;
          if (this.queueType === 'text') {
            this.template.type = 'text';
          } else {
            this.template.type = 'email';
          }
          const status = res.data?.status || {};
          // status setting
          if (status.tasks === status.active) {
            this.execStatus = 'awaiting';
          } else if (status.tasks === status.draft) {
            this.execStatus = 'draft';
          } else if (status.active && status.done) {
            this.execStatus = 'progressing';
          } else if (status.active && status.draft) {
            this.execStatus = 'pausing';
          }
          if (status?.recurrence_mode) {
            this.detailType = status?.recurrence_mode;
            this.recurrenceMode = status?.recurrence_mode;
          } else if (status?.source === 'schedule') {
            this.detailType = 'scheduled';
            this.recurrenceMode = '';
          } else {
            this.detailType = 'normal';
            this.recurrenceMode = '';
          }
          if (status?.next_due_date?.length) {
            const timeStr = status?.next_due_date?.filter((e) => !!e)[0];
            this.nextTime = new Date(timeStr);
          }
          if (status?.last_executed?.length) {
          }
          this.status.delivered = status.succeed || 0;
          this.status.failed = status.failed || 0;
          this.status.notExecuted = status.notExecuted || 0;
          this.status.awaiting = status.contacts || 0;
          if (this.status.awaiting) {
            this.changePanel('awaiting');
          } else if (this.status.delivered) {
            this.changePanel('delivered');
          } else if (this.status.failed) {
            this.changePanel('failed');
          }
          if (this.status.awaiting) {
            this.isAbleEdit = true;
          } else {
            this.isAbleEdit = false;
          }
        } else {
          // error showing
        }
      });
  }

  cancelContact(contact): void {
    const panel = this.currentPanel;
    this.notificationService
      .removeEmailContact({
        contact: contact._id,
        process: this.queue_id
      })
      .subscribe((res) => {
        if (res && res['status']) {
          const pos = _.findIndex(
            this.contacts[panel].data,
            (e) => e._id === contact._id
          );
          if (pos !== -1) {
            this.contacts[panel].data.splice(pos, 1);
            this.contacts[panel].data = [...this.contacts[panel].data];
            if (
              panel !== 'task' &&
              panel === this.currentPanel &&
              this.status[panel] > this.contacts[panel].pageSize - 2
            ) {
              if (
                this.contacts[panel].data.length <
                this.contacts[panel].pageSize / 2
              ) {
                this.changeContactPage(this.contacts[panel].page);
              }
            }
          }
          this.status.awaiting--;
        }
      });
  }

  changePanel(panel: string): void {
    this.currentPanel = panel;
    this.contacts[panel].loading = true;
    this.loadDataSubscription && this.loadDataSubscription.unsubscribe();
    this.loadDataSubscription = this.notificationService
      .loadQueueContact({
        id: this.queue_id,
        limit: this.contacts[panel].pageSize,
        page: this.contacts[panel].page,
        category: panel,
        source: 'tasks'
      })
      .subscribe((res) => {
        this.contacts[panel].loading = false;
        if (res && res['data']) {
          const contacts = [];
          const additionals = {};
          if (this.currentPanel === 'failed') {
            res['data']['status'].forEach((e) => {
              if (e && e.contact && e.contact._id) {
                additionals[e.contact._id] = {
                  ...e,
                  contact: undefined
                };
                if (e.error) {
                  additionals[e.contact._id]['failed_reason'] = e.error;
                  additionals[e.contact._id]['failed'] = true;
                }
              }
            });
          }
          (res['data']['contacts'] || []).forEach((e) => {
            let contactData = e;
            if (additionals[contactData._id]) {
              contactData = { ...contactData, ...additionals[contactData._id] };
            }
            contactData.status = this.currentPanel;
            const contact = new CampContact().deserialize(contactData);
            contacts.push(contact);
          });
          this.contacts[panel].data = contacts;
        } else {
          this.contacts[panel].data = [];
        }
      });
  }

  changeContactPage(page: number): void {
    const panel = this.currentPanel;
    this.contacts[panel].loading = true;
    this.contacts[panel].page = page;
    this.loadDataSubscription && this.loadDataSubscription.unsubscribe();
    this.loadDataSubscription = this.notificationService
      .loadQueueContact({
        id: this.queue_id,
        limit: this.contacts[panel].pageSize,
        page: this.contacts[panel].page,
        category: panel,
        source: 'tasks'
      })
      .subscribe((res) => {
        this.contacts[panel].loading = false;
        if (res && res['data']) {
          const contacts = [];
          const additionals = {};
          if (this.currentPanel === 'failed') {
            res['data']['status'].forEach((e) => {
              if (e && e.contact && e.contact._id) {
                additionals[e.contact._id] = { ...e, contact: undefined };
              }
            });
          }
          (res['data']['contacts'] || []).forEach((e) => {
            let contactData = e;
            if (additionals[contactData._id]) {
              contactData = { ...contactData, ...additionals[contactData._id] };
            }
            contactData.status = this.currentPanel;
            const contact = new CampContact().deserialize(contactData);
            contacts.push(contact);
          });
          this.contacts[panel].data = contacts;
        } else {
          this.contacts[panel].data = [];
        }
      });
  }

  /**
   * Resume Task
   */
  resumeTask(): void {
    const current = Date.now() + 120000;
    const due_date = new Date(this.nextTime).getTime();
    if (due_date < current) {
      // Reschedule and resume
      this.rescheduleTask({ status: 'active' });
    } else {
      // Just resume
      this.updateTaskStatus({ status: 'active' });
    }
  }

  /**
   * Pause task
   */
  pauseTask(): void {
    this.updateTaskStatus({ status: 'draft' });
  }

  /**
   * Reschedule Task
   */
  rescheduleTask(payload = null): void {
    this.dialog
      .open(ScheduleSettingComponent, {
        width: '100%',
        maxWidth: '450px',
        data: {
          time: this.nextTime
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.time) {
          const time = res.time.getTime() - this.nextTime.getTime();
          this.notificationService
            .rescheduleTask({
              id: this.queue_id,
              time,
              payload
            })
            .subscribe((res) => {
              if (res?.status) {
                // updated
                this.loadQueue();
              }
            });
        }
      });
  }

  /**
   * Update task status
   * @param payload: { status, payload: {} }
   */
  updateTaskStatus(payload: any): void {
    this.notificationService
      .updateTaskStatus({ ...payload, id: this.queue_id })
      .subscribe((res) => {
        if (res?.status) {
          // update task
          this.loadQueue();
        }
      });
  }

  /**
   * Change recurrence duration
   */
  changeRecurrence(): void {
    this.dialog
      .open(ScheduleSettingComponent, {
        width: '100%',
        maxWidth: '450px',
        data: {
          recurrence: {
            set_recurrence: this.recurrenceMode ? true : false,
            recurrence_mode: this.recurrenceMode
          }
        }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.recurrence) {
          const set_recurrence = res?.recurrence?.set_recurrence || false;
          const payload = {
            set_recurrence,
            recurrence_mode: set_recurrence
              ? res?.recurrence?.recurrence_mode
              : ''
          };
          this.notificationService
            .updateTaskStatus({
              id: this.queue_id,
              payload
            })
            .subscribe((res) => {
              if (res?.status) {
                // updated
                this.loadQueue();
              }
            });
        }
      });
  }

  /**
   * Remove Task
   */
  removeTask(): void {
    this.notificationService.removeTask(this.queue_id).subscribe((res) => {
      if (res?.status) {
      }
    });
  }

  changeEmailForm(): void {
    this.isEditing = true;
  }

  onChangeEmailTemplate(evt): void {
    let dlgTitle = '';
    let dlgMessage = '';
    if (this.queueType === 'email') {
      dlgTitle = 'Change Email Content';
      dlgMessage =
        'Are you sure change the email content to send for the awaiting contacts?';
    } else {
      dlgTitle = 'Change Text Content';
      dlgMessage =
        'Are you sure change the text content to send for the awaiting contacts?';
    }
    if (evt) {
      this.dialog
        .open(ConfirmComponent, {
          width: '90vw',
          maxWidth: '400px',
          position: {
            top: '100px'
          },
          data: {
            title: dlgTitle,
            message: dlgMessage
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            // api call
            const payload = evt;
            this.notificationService
              .updateTaskQueue(this.queue_id, payload)
              .subscribe((res) => {
                if (res?.data) {
                  this.template = evt;
                  this.isEditing = false;
                }
              });
          } else {
            this.isEditing = false;
          }
        });
    } else {
      this.isEditing = false;
    }
  }

  /**
   * Redirect to the contact detail page
   * @param contact: Contact Detail
   */
  openContact(contact: Contact): void {
    this.router.navigate(['/contacts/' + contact._id]);
  }

  getPrevPage(): string {
    if (this.handlerService.previousUrl == '/to-do') {
      return 'to TO-DO list';
    }
    if (this.handlerService.previousUrl.indexOf('/contacts') != -1) {
      return 'to Contact';
    }
    return '';
  }

  backPage(): void {
    this.handlerService.goBack(this.handlerService.previousUrl);
  }
}
