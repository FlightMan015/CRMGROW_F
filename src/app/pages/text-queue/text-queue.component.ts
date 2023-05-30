import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CampContact } from 'src/app/models/contact.model';
import { Material } from 'src/app/models/material.model';
import { NotificationService } from 'src/app/services/notification.service';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmComponent } from 'src/app/components/confirm/confirm.component';
import { Template } from 'src/app/models/template.model';

@Component({
  selector: 'app-text-queue',
  templateUrl: './text-queue.component.html',
  styleUrls: ['./text-queue.component.scss']
})
export class TextQueueComponent implements OnInit {
  queue_id: string = '';
  text: any;
  materials: Material[] = [];
  loading: boolean = false;
  currentPanel = 'awaiting';
  textTasks: any[] = [];
  taskPageSize: number = 1;
  taskTotalCount: number = 0;
  taskPage: number = 1;
  tasksLoading: boolean = false;
  loadDataSubscription: Subscription;

  contacts = {
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
    total: 0,
    awaiting: 0,
    delivered: 0,
    failed: 0
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
  loadContactsSubscription: Subscription;
  routeChangeSubscription: Subscription;

  isAbleEdit = true;
  isEditing = false;
  isSaving = false;
  template = new Template().deserialize({ type: 'text' });

  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
    this.routeChangeSubscription = this.route.params.subscribe((params) => {
      this.queue_id = params['id'];
      this.loadQueue();
    });
  }

  ngOnDestroy(): void {
    this.routeChangeSubscription && this.routeChangeSubscription.unsubscribe();
  }

  loadQueue(): void {
    this.text = {};
    this.materials = [];

    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.notificationService
      .getTextQueue({
        id: this.queue_id,
        limit: this.taskPageSize,
        page: 1,
        mode: 'init'
      })
      .subscribe((res) => {
        if (res) {
          console.log('text-res-------------', res);
          this.text = res.data['text'];
          this.textTasks = res.data['textTasks'];
          this.taskTotalCount = res.data['count'];
          const videos = res.data['videos'] || [];
          const pdfs = res.data['pdfs'] || [];
          const images = res.data['images'] || [];

          videos.forEach((e) => {
            const material = new Material().deserialize(e);
            material.material_type = 'video';
            this.materials.push(material);
          });
          pdfs.forEach((e) => {
            const material = new Material().deserialize(e);
            material.material_type = 'pdf';
            this.materials.push(material);
          });
          images.forEach((e) => {
            const material = new Material().deserialize(e);
            material.material_type = 'image';
            this.materials.push(material);
          });

          const status = res.data['status'] || {};
          this.status.delivered = status.succeed || 0;
          this.status.failed = status.failed || 0;
          this.status.total = status.contacts || 0;
          this.status.awaiting =
            this.status.total - this.status.failed - this.status.delivered;
          if (this.status.awaiting < 0) {
            this.status.awaiting = 0;
          }

          this.textTasks.forEach((e) => {
            if (e.status !== 'completed') {
              e.awaiting = e.contacts.length;
            }
            if (e.exec_result) {
              const failed = e.exec_result?.failed?.length || 0;
              const not_runned = e.exec_result?.notExecuted?.length || 0;
              e.failed = failed + not_runned;
              e.delivered = e.exec_result?.succeed?.length || 0;
            } else {
              e.failed = 0;
              e.delivered = 0;
            }
            if (e.status !== 'completed') {
              if (e.failed || e.delivered) {
                e.status = 'pending';
              }
            }
          });

          if (this.status.awaiting) {
            this.changePanel('awaiting');
          } else if (this.status.delivered) {
            this.changePanel('delivered');
          } else if (this.status.failed) {
            this.changePanel('failed');
          } else {
            this.changePanel('delivered');
          }
        } else {
          this.changePanel('awaiting');
        }
      });
  }

  /**
   *
   * @param session
   */
  loadTaskContacts(task): void {
    if (this.contacts.task._id !== task._id) {
      this.contacts.task.data = [];
    }
    this.currentPanel = 'task';
    this.contacts.task._id = task._id;
    this.contacts.task.title =
      'Assigned Contacts' + ' at ' + new Date(task.due_date + '').toISOString();
    this.contacts.task.loading = true;
    this.loadDataSubscription && this.loadDataSubscription.unsubscribe();
    this.loadDataSubscription = this.notificationService
      .loadTaskContact({ process_id: this.queue_id, task_id: task._id })
      .subscribe((res) => {
        this.contacts.task.loading = false;
        // Failed Contacts Collection
        if (res && res['data']) {
          const status = {};
          (res['data']['failed'] || []).forEach((e) => {
            if (e && e.contact && e.contact._id) {
              status[e.contact._id] = {
                ...e,
                contact: undefined,
                status: 'failed'
              };
            }
          });
          (res['data']['notExecuted'] || []).forEach((e) => {
            status[e] = {
              status: 'not executed'
            };
          });
          (res['data']['succeed'] || []).forEach((e) => {
            status[e] = {
              status: 'delivered'
            };
          });
          const contacts = [];
          if (res['data']['contacts']) {
            res['data']['contacts'].forEach((e) => {
              if (status[e._id]) {
                contacts.push(
                  new CampContact().deserialize({ ...e, ...status[e._id] })
                );
              } else {
                contacts.push(
                  new CampContact().deserialize({ ...e, status: 'awaiting' })
                );
              }
            });
          }
          this.contacts.task.data = contacts;
        }
      });
  }

  changePanel(panel: string): void {
    this.currentPanel = panel;
    this.contacts[panel].loading = true;
    this.loadContactsSubscription &&
      this.loadContactsSubscription.unsubscribe();
    this.loadContactsSubscription = this.notificationService
      .loadQueueContact({
        id: this.queue_id,
        limit: 15,
        page: this.contacts[panel].page,
        category: panel,
        source: 'notification'
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

  changeTaskPage(page: number): void {
    this.taskPage = page;
    this.tasksLoading = true;
    this.loadSubscription && this.loadSubscription.unsubscribe();
    this.loadSubscription = this.notificationService
      .getTextQueue({
        id: this.queue_id,
        limit: this.taskPageSize,
        page: page
      })
      .subscribe((res) => {
        this.tasksLoading = false;
        this.textTasks = res['data'] || [];
        this.textTasks.forEach((e) => {
          if (e.status !== 'completed') {
            e.awaiting = e.contacts.length;
          }
          if (e.exec_result) {
            const failed = e.exec_result?.failed?.length || 0;
            const not_runned = e.exec_result?.notExecuted?.length || 0;
            e.failed = failed + not_runned;
            e.delivered = e.exec_result?.succeed?.length || 0;
          } else {
            e.failed = 0;
            e.delivered = 0;
          }
          if (e.status !== 'completed') {
            if (e.failed || e.delivered) {
              e.status = 'pending';
            }
          }
        });
      });
  }

  cancelTask(task): void {
    const mode = 'delete';
    this.notificationService
      .removeEmailTask({ id: task._id, mode, process: this.queue_id })
      .subscribe((res) => {
        if (res && res['status']) {
          this.status.awaiting -= task.awaiting;
          if (mode == 'delete') {
            this.textTasks.some((e, index) => {
              if (e._id === task._id) {
                this.textTasks.splice(index, 1);
                return true;
              }
            });
            this.taskTotalCount--;
          }

          if (this.currentPanel === 'awaiting') {
            this.changeContactPage(this.contacts[this.currentPanel].page);
          } else if (this.currentPanel === 'task') {
            this.changePanel('awaiting');
          }
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
          this.textTasks.some((e, index) => {
            if (e._id === res['data']) {
              const pos = e['contacts'].indexOf(contact._id);
              if (pos !== -1) {
                e['contacts'].splice(pos, 1);
                e.awaiting--;
              }
              if (!e.awaiting) {
                this.textTasks.splice(index, 1);
              }
              return true;
            }
          });
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
        source: this.taskTotalCount ? 'tasks' : 'notification'
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
   * Change the text content view to form
   */
  changeContentForm(): void {
    this.isEditing = true;
  }

  /**
   * Save or close the edit form
   * @param evt: template data
   */
  onChangeTextTemplate(evt): void {
    if (evt) {
      this.dialog
        .open(ConfirmComponent, {
          width: '90vw',
          maxWidth: '400px',
          position: {
            top: '100px'
          },
          data: {
            title: 'Change Text Content',
            message:
              'Are you sure change the text content to send for the awaiting contacts?'
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
                if (res?.status) {
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
}
